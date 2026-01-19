import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  InitiateAuthCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  getUserByEmail,
  getUserByCognitoSub,
  createUser,
  getProductById,
  getSellerById,
} from '../db/queries-sequelize';
import { getRoleSpecificIds, UserForRoleLookup } from './userRole';
import { validateStripeSetup } from './seller';
import { Product as ProductType, User as UserType } from '../types';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || '';

export interface GuestCheckoutResult {
  success: boolean;
  user?: {
    id: number;
    cognitoSub: string;
    email: string;
    role: string;
    sellerId: number | null;
    promoterId: number | null;
    stewardId: number | null;
    features: Record<string, any>;
  };
  error?: string;
  code?: string;
}

/**
 * Process guest checkout - create or authenticate user
 */
export async function processGuestCheckout(
  email: string,
  password: string
): Promise<GuestCheckoutResult> {
  // Check if user exists in database
  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    // User exists - authenticate them
    try {
      const authCommand = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });
      await cognitoClient.send(authCommand);

      // Get Cognito user sub
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: email,
      });
      const cognitoUser = await cognitoClient.send(getUserCommand);
      const cognitoSub = cognitoUser.UserAttributes?.find(
        (attr) => attr.Name === 'sub'
      )?.Value;

      if (!cognitoSub) {
        return { success: false, error: 'Failed to get user info', code: 'AUTH_FAILED' };
      }

      const dbUser = await getUserByCognitoSub(cognitoSub);
      if (!dbUser) {
        return { success: false, error: 'User not found', code: 'USER_NOT_FOUND' };
      }

      const userForLookup: UserForRoleLookup = {
        id: dbUser.id,
        email: dbUser.email,
        cognito_sub: dbUser.cognito_sub,
        role: dbUser.role as UserForRoleLookup['role'],
      };
      const { sellerId, promoterId, stewardId } = await getRoleSpecificIds(userForLookup);

      return {
        success: true,
        user: {
          id: dbUser.id,
          cognitoSub: dbUser.cognito_sub,
          email: dbUser.email,
          role: dbUser.role,
          sellerId,
          promoterId,
          stewardId,
          features: dbUser.features || {},
        },
      };
    } catch (authError: any) {
      return { success: false, error: 'Invalid email or password', code: 'AUTH_FAILED' };
    }
  }

  // User doesn't exist - create new guest account
  try {
    // Create Cognito user
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
      ],
      MessageAction: 'SUPPRESS',
    });
    await cognitoClient.send(createUserCommand);

    // Set password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    });
    await cognitoClient.send(setPasswordCommand);

    // Get Cognito user sub
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: email,
    });
    const cognitoUser = await cognitoClient.send(getUserCommand);
    const cognitoSub = cognitoUser.UserAttributes?.find(
      (attr) => attr.Name === 'sub'
    )?.Value;

    if (!cognitoSub) {
      return { success: false, error: 'Failed to create user', code: 'ACCOUNT_CREATION_FAILED' };
    }

    // Create database user with GUEST role
    const dbUser = await createUser({
      cognito_sub: cognitoSub,
      email: email,
      role: 'GUEST',
      onboarding_status: 'COGNITO_CONFIRMED',
    });

    return {
      success: true,
      user: {
        id: dbUser.id,
        cognitoSub: dbUser.cognito_sub,
        email: dbUser.email,
        role: dbUser.role,
        sellerId: null,
        promoterId: null,
        stewardId: null,
        features: dbUser.features || {},
      },
    };
  } catch (createError: any) {
    if (
      createError.name === 'UsernameExistsException' ||
      createError.name === 'AliasExistsException'
    ) {
      // Try to authenticate if user already exists in Cognito
      return processGuestCheckout(email, password);
    }
    return {
      success: false,
      error: 'Unable to create account',
      code: 'ACCOUNT_CREATION_FAILED',
    };
  }
}

export interface ProductValidationResult {
  valid: boolean;
  product?: ProductType;
  seller?: any;
  error?: string;
  code?: string;
}

/**
 * Validate a product for purchase
 */
export async function validateProductForPurchase(
  productId: number,
  isAuthenticated: boolean = false
): Promise<ProductValidationResult> {
  const product = await getProductById(productId);

  if (!product) {
    return { valid: false, error: 'Product not found', code: 'PRODUCT_NOT_FOUND' };
  }

  if (!product.price_cents || product.price_cents <= 0) {
    return { valid: false, error: 'Product does not have a valid price', code: 'INVALID_PRICE' };
  }

  // Check if product is Kappa branded - requires authentication
  if (product.is_kappa_branded && !isAuthenticated) {
    return {
      valid: false,
      error:
        'Kappa Alpha Psi branded merchandise can only be purchased by verified members',
      code: 'AUTH_REQUIRED_FOR_KAPPA_BRANDED',
    };
  }

  // Get seller
  const seller = await getSellerById(product.seller_id);
  if (!seller) {
    return { valid: false, error: 'Seller not found', code: 'SELLER_NOT_FOUND' };
  }

  if (seller.status !== 'APPROVED') {
    return { valid: false, error: 'Seller is not approved', code: 'SELLER_NOT_APPROVED' };
  }

  if (!seller.stripe_account_id) {
    return {
      valid: false,
      error: 'Seller payment setup incomplete',
      code: 'STRIPE_NOT_CONNECTED',
    };
  }

  // Validate Stripe setup
  const stripeStatus = await validateStripeSetup(seller.stripe_account_id);
  if (!stripeStatus.valid) {
    return {
      valid: false,
      error: 'Seller payment setup incomplete',
      code: 'STRIPE_NOT_READY',
    };
  }

  return { valid: true, product, seller };
}

export interface CheckoutSessionParams {
  productId: number;
  productName: string;
  priceCents: number;
  connectedAccountId: string;
  buyerEmail: string;
  successUrl: string;
  cancelUrl: string;
  chapterId?: number;
  shippingCents?: number;
}

/**
 * Create checkout session parameters
 */
export function prepareCheckoutSessionParams(
  product: ProductType,
  seller: any,
  buyerEmail: string,
  shippingCents: number = 0
): CheckoutSessionParams {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const chapterId =
    (product as any).seller_sponsoring_chapter_id ||
    seller.sponsoring_chapter_id ||
    undefined;

  return {
    productId: product.id,
    productName: product.name,
    priceCents: product.price_cents,
    connectedAccountId: seller.stripe_account_id,
    buyerEmail,
    successUrl: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${frontendUrl}/cancel`,
    chapterId,
    shippingCents,
  };
}
