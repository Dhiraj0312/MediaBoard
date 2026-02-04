'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, user } = useAuth();

  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push(redirectTo);
    }
  }, [user, router, redirectTo]);

  const handleLogin = async (email, password) => {
    setIsLoading(true);
    setError('');

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message || 'Login failed');
        return;
      }

      // Redirect to intended destination or dashboard
      router.push(redirectTo);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render login form if user is already authenticated
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-6 6c-1.105 0-2-.895-2-2M9 7a2 2 0 00-2 2m4 0a6 6 0 006 6c1.105 0 2-.895 2-2m-6-6V4a2 2 0 012-2h4a2 2 0 012 2v3M9 7V4a2 2 0 012-2h4a2 2 0 012 2v3" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Digital Signage Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to manage your digital signage network
          </p>
        </div>
        
        <LoginForm 
          onSubmit={handleLogin}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}