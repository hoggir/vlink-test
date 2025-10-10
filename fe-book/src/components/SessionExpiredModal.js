'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SessionExpiredModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if session was expired before refresh
    if (typeof window !== 'undefined') {
      const sessionExpired = sessionStorage.getItem('sessionExpired');
      if (sessionExpired === 'true') {
        // Clear everything and redirect
        sessionStorage.removeItem('sessionExpired');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
    }

    // Register global function
    if (typeof window !== 'undefined') {
      window.triggerSessionExpired = () => {
        // Clear localStorage immediately when modal appears
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Set flag for refresh detection
        sessionStorage.setItem('sessionExpired', 'true');

        // Trigger storage event to update navbar
        window.dispatchEvent(new Event('storage'));

        setIsOpen(true);
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.triggerSessionExpired = null;
      }
    };
  }, [router]);

  const handleGoToLogin = () => {
    setIsOpen(false);
    // Clear session expired flag
    sessionStorage.removeItem('sessionExpired');
    // Redirect to login (localStorage already cleared when modal appeared)
    router.push('/login');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Icon */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Title */}
          <h3 className="mt-4 text-lg font-semibold text-center text-gray-900">
            Session Expired
          </h3>

          {/* Message */}
          <div className="mt-2">
            <p className="text-sm text-center text-gray-600">
              Your session has expired. Please log in again to continue.
            </p>
          </div>

          {/* Button */}
          <div className="mt-6">
            <button
              onClick={handleGoToLogin}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
