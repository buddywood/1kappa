import {
  CognitoIdentityProviderClient,
  GetUserCommand,
  InitiateAuthCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION || process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || '';
const COGNITO_REGION = process.env.COGNITO_REGION || process.env.AWS_REGION || 'us-east-1';

// JWKS client for token verification
const client = jwksClient({
  jwksUri: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.getPublicKey();
    callback(err, signingKey);
  });
}

export interface CognitoTokenPayload {
  sub: string;
  email: string;
  'cognito:username': string;
  'cognito:groups'?: string[];
  exp: number;
  iat: number;
  token_use: string;
}

/**
 * Verify a Cognito JWT token
 */
export async function verifyCognitoToken(token: string): Promise<CognitoTokenPayload | null> {
  return new Promise((resolve) => {
    jwt.verify(
      token,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`,
      },
      (err, decoded) => {
        if (err) {
          console.error('Token verification error:', err);
          resolve(null);
        } else {
          resolve(decoded as CognitoTokenPayload);
        }
      }
    );
  });
}

/**
 * Get user information from Cognito using access token
 */
export async function getCognitoUser(accessToken: string) {
  try {
    const command = new GetUserCommand({
      AccessToken: accessToken,
    });
    const response = await cognitoClient.send(command);
    return response;
  } catch (error) {
    console.error('Error getting Cognito user:', error);
    throw error;
  }
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email: string, password: string) {
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });
    const response = await cognitoClient.send(command);
    return response;
  } catch (error: any) {
    console.error('Error authenticating user:', error);
    throw error;
  }
}

/**
 * Extract user info from Cognito token payload
 */
export function extractUserInfoFromToken(payload: CognitoTokenPayload) {
  return {
    cognitoSub: payload.sub,
    email: payload.email || payload['cognito:username'],
    groups: payload['cognito:groups'] || [],
  };
}

