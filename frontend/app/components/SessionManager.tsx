'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const DEFAULT_SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes (default)
const REMEMBER_ME_SESSION_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000; // 30 days (when remember me is checked)
const DEFAULT_WARNING_TIME_MS = 5 * 60 * 1000; // Show warning 5 minutes before expiry (for short sessions)
const REMEMBER_ME_WARNING_TIME_MS = 24 * 60 * 60 * 1000; // Show warning 1 day before expiry (for long sessions)
const SESSION_START_KEY = 'session_start_time';
const REMEMBER_ME_KEY = 'remember_me';

export default function SessionManager() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  
  // Check if remember me is enabled
  const getSessionTimeout = useCallback(() => {
    if (typeof window !== 'undefined') {
      const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
      return rememberMe ? REMEMBER_ME_SESSION_TIMEOUT_MS : DEFAULT_SESSION_TIMEOUT_MS;
    }
    return DEFAULT_SESSION_TIMEOUT_MS;
  }, []);

  // Get appropriate warning time based on session length
  const getWarningTime = useCallback(() => {
    if (typeof window !== 'undefined') {
      const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
      return rememberMe ? REMEMBER_ME_WARNING_TIME_MS : DEFAULT_WARNING_TIME_MS;
    }
    return DEFAULT_WARNING_TIME_MS;
  }, []);

  const handleLogout = useCallback(async () => {
    setShowDialog(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_START_KEY);
    }
    await signOut({ 
      callbackUrl: '/login',
      redirect: true 
    });
  }, []);

  const handleExtendSession = useCallback(async () => {
    try {
      // Refresh the session (this will trigger token refresh in NextAuth)
      await update();
      // Reset the session start time
      const newStartTime = Date.now();
      setSessionStartTime(newStartTime);
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_START_KEY, newStartTime.toString());
      }
      setShowDialog(false);
    } catch (error) {
      console.error('Error extending session:', error);
      // If refresh fails, logout
      handleLogout();
    }
  }, [update, handleLogout]);

  useEffect(() => {
    if (!session) {
      // Clear session start time when logged out
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_START_KEY);
      }
      setSessionStartTime(null);
      setShowDialog(false);
      return;
    }

    // Initialize session start time - check localStorage first, then set if not exists
    if (sessionStartTime === null && typeof window !== 'undefined') {
      const stored = localStorage.getItem(SESSION_START_KEY);
      const sessionTimeout = getSessionTimeout();
      if (stored) {
        const storedTime = parseInt(stored, 10);
        // Check if stored session is still valid
        const elapsed = Date.now() - storedTime;
        if (elapsed < sessionTimeout) {
          setSessionStartTime(storedTime);
        } else {
          // Stored session expired, start fresh
          const newStartTime = Date.now();
          setSessionStartTime(newStartTime);
          localStorage.setItem(SESSION_START_KEY, newStartTime.toString());
        }
      } else {
        // No stored session, start fresh
        const newStartTime = Date.now();
        setSessionStartTime(newStartTime);
        localStorage.setItem(SESSION_START_KEY, newStartTime.toString());
      }
      return;
    }

    const checkSession = () => {
      if (!sessionStartTime) return;

      const sessionTimeout = getSessionTimeout();
      const warningTime = getWarningTime();
      const elapsed = Date.now() - sessionStartTime;
      const remaining = sessionTimeout - elapsed;
      
      setTimeRemaining(Math.max(0, remaining));

      // Show warning dialog when warning time remaining
      if (remaining <= warningTime && remaining > 0 && !showDialog) {
        setShowDialog(true);
      }

      // Auto logout when session expires
      if (remaining <= 0) {
        handleLogout();
      }
    };

    // Check every second
    const interval = setInterval(checkSession, 1000);
    checkSession(); // Initial check

    return () => clearInterval(interval);
  }, [session, sessionStartTime, showDialog, handleLogout, getSessionTimeout, getWarningTime]);

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!session) {
    return null;
  }

  return (
    <Dialog open={showDialog} onOpenChange={(open) => {
      // Prevent closing the dialog without making a choice
      // Only allow closing via the buttons
      if (!open) {
        handleLogout();
      }
    }}>
      <DialogContent className="max-w-md text-center" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-8 h-8 text-yellow-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <DialogTitle className="text-2xl font-extrabold text-[#0D0D0F] mb-2">
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription className="text-gray-600 mb-4">
            Your session will expire in <strong className="text-crimson">{formatTimeRemaining(timeRemaining)}</strong>
          </DialogDescription>
          <p className="text-sm text-gray-500">
            Would you like to extend your session to continue working?
          </p>
        </DialogHeader>

        <div className="flex gap-4 justify-center mt-6">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="px-6 py-3"
          >
            Log Out
          </Button>
          <Button
            onClick={handleExtendSession}
            className="px-6 py-3 bg-[#8A0C13] hover:bg-[#A51720] text-white"
          >
            Extend Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

