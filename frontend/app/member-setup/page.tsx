'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function MemberSetupPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status: sessionStatus } = useSession();
  const [isNavigating, setIsNavigating] = useState(false);

  // Log component mount and session state
  useEffect(() => {
    console.log('[MemberSetup] Component mounted');
    console.log('[MemberSetup] Current pathname:', pathname);
    console.log('[MemberSetup] Session status:', sessionStatus);
    console.log('[MemberSetup] Session data:', session);
    console.log('[MemberSetup] User role:', (session?.user as any)?.role);
    console.log('[MemberSetup] User memberId:', (session?.user as any)?.memberId);
    console.log('[MemberSetup] User sellerId:', (session?.user as any)?.sellerId);
  }, [pathname, sessionStatus, session]);

  const handleStartRegistration = () => {
    console.log('[MemberSetup] Start Registration button clicked');
    console.log('[MemberSetup] Current state:', {
      pathname,
      sessionStatus,
      isNavigating,
      hasSession: !!session,
      userRole: (session?.user as any)?.role,
      userMemberId: (session?.user as any)?.memberId,
      userSellerId: (session?.user as any)?.sellerId,
    });

    try {
      setIsNavigating(true);
      console.log('[MemberSetup] Attempting to navigate to /register');
      
      // Use setTimeout to ensure state is logged before navigation
      setTimeout(() => {
        console.log('[MemberSetup] Executing router.push("/register")');
        router.push('/register');
        console.log('[MemberSetup] router.push completed');
      }, 0);
    } catch (error) {
      console.error('[MemberSetup] Error during navigation:', error);
      setIsNavigating(false);
    }
  };

  const handleLoginClick = () => {
    console.log('[MemberSetup] Login button clicked');
    console.log('[MemberSetup] Current state:', {
      pathname,
      sessionStatus,
      isNavigating,
    });

    try {
      setIsNavigating(true);
      console.log('[MemberSetup] Attempting to navigate to /login');
      
      setTimeout(() => {
        console.log('[MemberSetup] Executing router.push("/login")');
        router.push('/login');
        console.log('[MemberSetup] router.push completed');
      }, 0);
    } catch (error) {
      console.error('[MemberSetup] Error during navigation:', error);
      setIsNavigating(false);
    }
  };

  // Log navigation state changes
  useEffect(() => {
    if (isNavigating) {
      console.log('[MemberSetup] Navigation in progress...');
    }
  }, [isNavigating]);

  // Check if user is authenticated but doesn't have member access
  const isAuthenticated = sessionStatus === 'authenticated';
  const userRole = (session?.user as any)?.role;
  const isSteward = (session?.user as any)?.is_steward || (session?.user as any)?.stewardId;
  const needsMemberSetup = isAuthenticated && userRole !== 'ADMIN' && userRole !== 'MEMBER' && userRole !== 'STEWARD' && !isSteward;

  return (
    <div className="min-h-screen bg-cream text-midnight-navy">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Alert for authenticated users without member access */}
          {needsMemberSetup && (
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Member Registration Required</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    To access the member dashboard and member-only features, you need to complete your member registration and verification. Complete the steps below to get started.
                  </p>
                </div>
              </div>
            </div>
          )}

          <h1 className="text-3xl font-display font-bold text-midnight-navy mb-2">
            Become a Member
          </h1>
          <p className="text-lg text-midnight-navy/70 mb-8">
            Join the 1Kappa community and connect with brothers worldwide. Complete your profile and get verified to unlock all features.
          </p>

          <div className="space-y-8">
            {/* Qualification Section */}
            <div className="bg-cream p-6 rounded-lg">
              <h2 className="text-xl font-display font-semibold text-midnight-navy mb-4">
                Who Can Join?
              </h2>
              <p className="text-midnight-navy/70 mb-4">
                Membership on 1Kappa is open to all initiated members of Kappa Alpha Psi Fraternity, Inc.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-midnight-navy/70">
                <li>You must be an initiated member of Kappa Alpha Psi</li>
                <li>You must have a valid membership number</li>
                <li>You must provide accurate chapter and initiation information</li>
                <li>Your membership will be verified before full access is granted</li>
              </ul>
            </div>

            {/* Verification Process Section */}
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
              <h2 className="text-xl font-display font-semibold text-midnight-navy mb-4">
                Verification Process
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-crimson text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-midnight-navy mb-1">Complete Your Profile</h3>
                    <p className="text-sm text-midnight-navy/70">
                      Provide your membership number, chapter information, initiation details, and upload a headshot.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-crimson text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-midnight-navy mb-1">Submit for Verification</h3>
                    <p className="text-sm text-midnight-navy/70">
                      Your information will be reviewed and verified against fraternity records.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-crimson text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-midnight-navy mb-1">Get Verified</h3>
                    <p className="text-sm text-midnight-navy/70">
                      Once verified, you&apos;ll have full access to all features including the Steward Marketplace, seller applications, and event promotions.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-white rounded border border-blue-200">
                <p className="text-sm text-midnight-navy/70">
                  <strong>Verification Timeline:</strong> Verification typically takes 24-48 hours. You&apos;ll receive an email notification once your membership has been verified.
                </p>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-cream p-6 rounded-lg">
              <h2 className="text-xl font-display font-semibold text-midnight-navy mb-4">
                Member Benefits
              </h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-midnight-navy/70">
                <li>Connect with brothers worldwide through the member directory</li>
                <li>Shop authentic merchandise from verified sellers</li>
                <li>Claim legacy items from Stewards (verified members only)</li>
                <li>Discover and RSVP to fraternity events</li>
                <li>Apply to become a Seller, Promoter, or Steward</li>
                <li>Support collegiate chapters through purchases and donations</li>
              </ul>
            </div>

            {/* CTA */}
            <div className="flex gap-4">
              <button
                onClick={handleStartRegistration}
                disabled={isNavigating}
                className="flex-1 bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isNavigating ? 'Loading...' : 'Start Registration'}
              </button>
              <button
                onClick={handleLoginClick}
                disabled={isNavigating}
                className="px-6 py-3 border-2 border-crimson text-crimson rounded-full font-semibold hover:bg-crimson/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Already Have an Account?
              </button>
            </div>
            
            {/* Debug info (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs font-mono">
                <div className="font-bold mb-2">Debug Info:</div>
                <div>Pathname: {pathname}</div>
                <div>Session Status: {sessionStatus}</div>
                <div>Is Navigating: {isNavigating ? 'Yes' : 'No'}</div>
                <div>Has Session: {session ? 'Yes' : 'No'}</div>
                {session && (
                  <>
                    <div>User Role: {(session.user as any)?.role || 'N/A'}</div>
                    <div>Member ID: {(session.user as any)?.memberId || 'N/A'}</div>
                    <div>Seller ID: {(session.user as any)?.sellerId || 'N/A'}</div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

