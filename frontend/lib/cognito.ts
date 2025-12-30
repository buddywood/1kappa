import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute, CognitoRefreshToken } from 'amazon-cognito-identity-js';

let userPoolInstance: CognitoUserPool | null = null;

function getUserPool(): CognitoUserPool {
  if (!userPoolInstance) {
    const userPoolId = (process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '').trim();
    const clientId = (process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '').trim();
    
    // Debug logging (only in server-side)
    if (typeof window === 'undefined') {
      console.log('[Cognito] Environment check:', {
        hasUserPoolId: !!userPoolId,
        hasClientId: !!clientId,
        userPoolIdLength: userPoolId.length,
        clientIdLength: clientId.length,
        userPoolIdPreview: userPoolId ? `${userPoolId.substring(0, 10)}...` : 'empty',
        clientIdPreview: clientId ? `${clientId.substring(0, 10)}...` : 'empty',
      });
    }
    
    if (!userPoolId || !clientId) {
      throw new Error(
        `Cognito configuration missing: UserPoolId=${!!userPoolId}, ClientId=${!!clientId}. ` +
        `Check NEXT_PUBLIC_COGNITO_USER_POOL_ID and NEXT_PUBLIC_COGNITO_CLIENT_ID environment variables.`
      );
    }
    
    const poolData = {
      UserPoolId: userPoolId,
      ClientId: clientId,
    };
    userPoolInstance = new CognitoUserPool(poolData);
  }
  return userPoolInstance;
}

export interface SignInResult {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  userSub: string;
  email: string;
}

// Store the cognito user instance for password change
let pendingPasswordChangeUser: CognitoUser | null = null;

/**
 * Sign in a user with email and password
 */
export function signIn(email: string, password: string): Promise<SignInResult> {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: getUserPool(),
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        pendingPasswordChangeUser = null;
        const accessToken = result.getAccessToken().getJwtToken();
        const idToken = result.getIdToken().getJwtToken();
        const refreshToken = result.getRefreshToken().getToken();

        // Get user attributes from ID token
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        const userSub = payload.sub;
        const email = payload.email || payload['cognito:username'];

        resolve({
          accessToken,
          idToken,
          refreshToken,
          userSub,
          email,
        });
      },
      onFailure: (err) => {
        pendingPasswordChangeUser = null;
        reject(err);
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        // Store the cognito user for password change
        pendingPasswordChangeUser = cognitoUser;
        const error = new Error('NEW_PASSWORD_REQUIRED: Please change your password');
        (error as any).code = 'NEW_PASSWORD_REQUIRED';
        (error as any).name = 'NEW_PASSWORD_REQUIRED';
        reject(error);
      },
    });
  });
}

/**
 * Complete the new password challenge
 */
export function completeNewPasswordChallenge(
  newPassword: string,
  userAttributes?: { [key: string]: string }
): Promise<SignInResult> {
  return new Promise((resolve, reject) => {
    if (!pendingPasswordChangeUser) {
      reject(new Error('No pending password change. Please login first.'));
      return;
    }

    pendingPasswordChangeUser.completeNewPasswordChallenge(
      newPassword,
      userAttributes || {},
      {
        onSuccess: (result) => {
          pendingPasswordChangeUser = null;
          const accessToken = result.getAccessToken().getJwtToken();
          const idToken = result.getIdToken().getJwtToken();
          const refreshToken = result.getRefreshToken().getToken();

          // Get user attributes from ID token
          const payload = JSON.parse(atob(idToken.split('.')[1]));
          const userSub = payload.sub;
          const email = payload.email || payload['cognito:username'];

          resolve({
            accessToken,
            idToken,
            refreshToken,
            userSub,
            email,
          });
        },
        onFailure: (err) => {
          pendingPasswordChangeUser = null;
          reject(err);
        },
      }
    );
  });
}

/**
 * Sign out the current user
 */
export function signOut(): void {
  const cognitoUser = getUserPool().getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): Promise<CognitoUser | null> {
  return new Promise((resolve) => {
    const cognitoUser = getUserPool().getCurrentUser();
    if (cognitoUser) {
      cognitoUser.getSession((err: Error | null, session: any) => {
        if (err || !session || !session.isValid()) {
          resolve(null);
        } else {
          resolve(cognitoUser);
        }
      });
    } else {
      resolve(null);
    }
  });
}

/**
 * Get the current user's session tokens
 */
export function getCurrentSession(): Promise<SignInResult | null> {
  return new Promise((resolve) => {
    const cognitoUser = getUserPool().getCurrentUser();
    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err: Error | null, session: any) => {
      if (err || !session || !session.isValid()) {
        resolve(null);
        return;
      }

      const accessToken = session.getAccessToken().getJwtToken();
      const idToken = session.getIdToken().getJwtToken();
      const refreshToken = session.getRefreshToken().getToken();

      const payload = JSON.parse(atob(idToken.split('.')[1]));
      const userSub = payload.sub;
      const email = payload.email || payload['cognito:username'];

      resolve({
        accessToken,
        idToken,
        refreshToken,
        userSub,
        email,
      });
    });
  });
}

/**
 * Refresh tokens using refresh token
 */
export function refreshTokens(refreshToken: string, email: string): Promise<SignInResult> {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: getUserPool(),
    });

    const cognitoRefreshToken = new CognitoRefreshToken({
      RefreshToken: refreshToken,
    });

    cognitoUser.refreshSession(cognitoRefreshToken, (err, session) => {
      if (err || !session) {
        reject(err || new Error('Failed to refresh session'));
        return;
      }

      const accessToken = session.getAccessToken().getJwtToken();
      const idToken = session.getIdToken().getJwtToken();
      const newRefreshToken = session.getRefreshToken().getToken();

      const payload = JSON.parse(atob(idToken.split('.')[1]));
      const userSub = payload.sub;
      const email = payload.email || payload['cognito:username'];

      resolve({
        accessToken,
        idToken,
        refreshToken: newRefreshToken,
        userSub,
        email,
      });
    });
  });
}

/**
 * Request password reset code
 */
export function forgotPassword(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: getUserPool(),
    });

    cognitoUser.forgotPassword({
      onSuccess: () => {
        resolve();
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * Confirm password reset with code
 */
export function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: getUserPool(),
    });

    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => {
        resolve();
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}

