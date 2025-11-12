import { useSession } from 'next-auth/react';

/**
 * Custom hook to check if user is fully authenticated (has completed onboarding)
 * Returns true only if user is authenticated AND has completed onboarding
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const onboardingStatus = (session?.user as any)?.onboarding_status;
  
  const isAuthenticated = status === 'authenticated' && 
                          session?.user && 
                          onboardingStatus === 'ONBOARDING_FINISHED';
  
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
 */
export function isFullyAuthenticated(session: any): boolean {
  if (!session || !session.user) return false;
  const onboardingStatus = (session.user as any)?.onboarding_status;
  return onboardingStatus === 'ONBOARDING_FINISHED';
}

