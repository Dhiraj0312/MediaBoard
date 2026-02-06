'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function ErrorGuidance({ error, onRetry }) {
  const router = useRouter();
  const { checkBackendHealth } = useAuth();

  const getGuidance = (error) => {
    const errorCode = error?.code || error?.status;

    switch (errorCode) {
      case 'ERR_CONNECTION_REFUSED':
        return {
          title: 'Backend Server Not Running',
          description: 'The backend server is not accessible. Please start it to continue.',
          steps: [
            'Open a terminal in the project root directory',
            'Navigate to the backend folder: cd backend',
            'Install dependencies (if not done): npm install',
            'Start the server: npm run dev',
            'Wait for the message "Server running on port 3001"'
          ],
          actions: [
            {
              label: 'Check Connection',
              onClick: async () => {
                await checkBackendHealth();
                if (onRetry) onRetry();
              },
              variant: 'primary'
            }
          ]
        };

      case 'MISSING_TOKEN':
      case 'INVALID_TOKEN':
      case 'EXPIRED_TOKEN':
      case 401:
        return {
          title: 'Authentication Required',
          description: 'Your session has expired or is invalid. Please log in again.',
          steps: [
            'Click the "Log In" button below',
            'Enter your credentials',
            'You will be redirected back after successful login'
          ],
          actions: [
            {
              label: 'Log In',
              onClick: () => router.push('/login'),
              variant: 'primary'
            },
            {
              label: 'Retry',
              onClick: onRetry,
              variant: 'secondary'
            }
          ]
        };

      case 'AUTH_SERVICE_ERROR':
        return {
          title: 'Authentication Service Error',
          description: 'There was an error with the authentication service.',
          steps: [
            'Try refreshing the page',
            'Check your internet connection',
            'If the problem persists, contact support'
          ],
          actions: [
            {
              label: 'Retry',
              onClick: onRetry,
              variant: 'primary'
            },
            {
              label: 'Contact Support',
              onClick: () => {
                // Could open a support modal or redirect to support page
                console.log('Contact support clicked');
              },
              variant: 'secondary'
            }
          ]
        };

      default:
        return {
          title: 'Unexpected Error',
          description: error?.message || 'An unexpected error occurred.',
          steps: [
            'Try refreshing the page',
            'Check your internet connection',
            'Clear your browser cache and cookies',
            'If the problem persists, contact support'
          ],
          actions: [
            {
              label: 'Retry',
              onClick: onRetry,
              variant: 'primary'
            }
          ]
        };
    }
  };

  if (!error) return null;

  const guidance = getGuidance(error);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-medium text-gray-900">
            {guidance.title}
          </h3>
          <div className="mt-2 text-sm text-gray-600">
            <p>{guidance.description}</p>
          </div>

          {guidance.steps && guidance.steps.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Steps to resolve:
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                {guidance.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {guidance.actions && guidance.actions.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {guidance.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  disabled={!action.onClick}
                  className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    action.variant === 'primary'
                      ? 'border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
