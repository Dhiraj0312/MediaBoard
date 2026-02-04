'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && initialized) {
      if (user) {
        // User is authenticated, redirect to dashboard
        router.push('/dashboard');
      } else {
        // User is not authenticated, redirect to login
        router.push('/login');
      }
    }
  }, [user, loading, initialized, router]);

  // Show loading state while checking authentication
  if (loading || !initialized) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold mb-2">Digital Signage Platform</h1>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  // This should not be reached due to the redirect, but just in case
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Digital Signage Platform
        </h1>
        <p className="text-center text-muted-foreground">
          Enterprise digital signage management system
        </p>
      </div>
    </main>
  );
}