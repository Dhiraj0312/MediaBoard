'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children, redirectTo = '/login' }) {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && initialized && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, initialized, router, redirectTo]);

  // Show loading state while checking authentication
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render children if user is not authenticated
  if (!user) {
    return null;
  }

  return children;
}

// Higher-order component version
export function withAuth(Component, redirectTo = '/login') {
  return function AuthenticatedComponent(props) {
    return (
      <ProtectedRoute redirectTo={redirectTo}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}