import { useSession } from 'next-auth/react';

/**
 * Custom hook to check if user is fully authenticated (has completed onboarding)
 * Returns true if user is authenticated AND:
 * - Has completed onboarding (ONBOARDING_FINISHED), OR
 * - Is a GUEST user with COGNITO_CONFIRMED status (guests don't need member onboarding)
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const onboardingStatus = (session?.user as any)?.onboarding_status;
  const userRole = (session?.user as any)?.role;
  
  // GUEST users with 'COGNITO_CONFIRMED' are considered authenticated for basic site access
  // Other users need 'ONBOARDING_FINISHED' status
  const isAuthenticated = status === 'authenticated' && 
                          session?.user && 
                          (onboardingStatus === 'ONBOARDING_FINISHED' ||
                           (userRole === 'GUEST' && onboardingStatus === 'COGNITO_CONFIRMED'));
  
  return {
    session,
    status,
    isAuthenticated,
    isLoading: status === 'loading',
    user: session?.user,
    onboardingStatus,
  };
}

/**
 * Check if a session object represents a fully authenticated user
 * (useful for server-side or outside React components)
 * GUEST users with 'COGNITO_CONFIRMED' are considered authenticated for basic site access
 */
export function isFullyAuthenticated(session: any): boolean {
  if (!session || !session.user) return false;
  const onboardingStatus = (session.user as any)?.onboarding_status;
  const userRole = (session.user as any)?.role;
  
  return onboardingStatus === 'ONBOARDING_FINISHED' ||
         (userRole === 'GUEST' && onboardingStatus === 'COGNITO_CONFIRMED');
}

