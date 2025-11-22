/**
 * AWS Cognito Authentication Service for Mobile App
 * 
 * This module provides authentication functionality using AWS Cognito.
 * 
 * This implementation uses backend endpoints to interact with Cognito,
 * which is more compatible with React Native/Expo.
 */

import { API_URL } from './constants';

export interface CognitoTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface CognitoUserAttributes {
  email: string;
  sub: string;
  email_verified?: boolean;
}

/**
 * Sign up a new user with Cognito
 * Uses backend endpoint
 */
export async function signUp(email: string, password: string): Promise<{ userSub: string; codeDeliveryDetails?: any }> {
  const response = await fetch(`${API_URL}/api/members/cognito/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to sign up' }));
    const error = new Error(errorData.error || 'Failed to sign up');
    (error as any).code = errorData.code || 'SignUpError';
    (error as any).name = errorData.code || 'SignUpError';
    throw error;
  }

  const data = await response.json();
  return {
    userSub: data.userSub,
    codeDeliveryDetails: data.codeDeliveryDetails,
  };
}

/**
 * Verify email with confirmation code
 * Uses backend endpoint
 */
export async function confirmSignUp(email: string, code: string, cognitoSub?: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/members/cognito/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, code, cognito_sub: cognitoSub }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to verify email' }));
    const error = new Error(errorData.error || 'Failed to verify email');
    (error as any).code = errorData.code || 'VerificationError';
    (error as any).name = errorData.code || 'VerificationError';
    throw error;
  }

  await response.json();
}

/**
 * Sign in with email and password
 * Uses backend endpoint to authenticate with Cognito
 * Returns tokens and user info
 */
export async function signIn(email: string, password: string): Promise<{
  tokens: CognitoTokens;
  user: {
    id: number;
    email: string;
    role: string;
    memberId: number | null;
    sellerId: number | null;
    promoterId: number | null;
    stewardId: number | null;
    name: string | null;
  };
}> {
  const response = await fetch(`${API_URL}/api/members/cognito/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to sign in' }));
    const error = new Error(errorData.error || 'Failed to sign in');
    (error as any).code = errorData.code;
    (error as any).name = errorData.code || 'SignInError';
    throw error;
  }

  const data = await response.json();
  return {
    tokens: data.tokens,
    user: data.user,
  };
}

/**
 * Refresh access token using refresh token
 * TODO: Implement backend endpoint for token refresh
 */
export async function refreshTokens(refreshToken: string, email: string): Promise<CognitoTokens> {
  throw new Error('Token refresh not yet implemented. Please sign in again.');
}

/**
 * Sign out (clear local tokens)
 * Note: Token revocation is handled by clearing local storage in auth context
 */
export async function signOut(email: string): Promise<void> {
  // No-op - local token clearing is handled by auth context
  // Backend doesn't need to be called for sign out
}

/**
 * Forgot password - request password reset code
 * Uses backend endpoint
 */
export async function forgotPassword(email: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/members/cognito/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to request password reset' }));
    const error = new Error(errorData.error || 'Failed to request password reset');
    (error as any).code = errorData.code || 'ForgotPasswordError';
    throw error;
  }

  await response.json();
}

/**
 * Confirm password reset with code
 * Uses backend endpoint
 */
export async function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  const response = await fetch(`${API_URL}/api/members/cognito/confirm-forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, code, newPassword }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to reset password' }));
    const error = new Error(errorData.error || 'Failed to reset password');
    (error as any).code = errorData.code || 'ConfirmPasswordResetError';
    throw error;
  }

  await response.json();
}

