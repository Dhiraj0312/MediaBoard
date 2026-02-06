'use client';

import React from 'react';
import { Alert } from '@/components/ui/Alert';

export function AuthErrorMessage({ error, onRetry, onLogin }) {
  if (!error) return null;

  const getErrorDetails = (error) => {
    const errorCode = error.code || error.status;
    
    switch (errorCode) {
      case 'MISSING_TOKEN':
      case 401:
        return {
          title: 'Authentication Required',
          message: 'Your session has expired or you are not logged in. Please log in to continue.',
          action: 'login',
          actionText: 'Go to Login'
        };
      
      case 'INVALID_TOKEN':
        return {
          title: 'Session Expired',
          message: 'Your authentication token is no longer valid. Please log in again.',
          action: 'login',
          actionText: 'Log In Again'
        };
      
      case 'EXPIRED_TOKEN':
        return {
          title: 'Session Expired',
          message: 'Your session has expired. Please log in again to continue.',
          action: 'login',
          actionText: 'Log In Again'
        };
      
      case 'ERR_CONNECTION_REFUSED':
        return {
          title: 'Connection Error',
          message: 'Unable to connect to the server. Please check your connection and try again.',
          action: 'retry',
          actionText: 'Retry'
        };
      
      case 'AUTH_SERVICE_ERROR':
        return {
          title: 'Authentication Error',
          message: 'An error occurred during authentication. Please try again or contact support if the problem persists.',
          action: 'retry',
          actionText: 'Try Again'
        };
      
      default:
        return {
          title: 'Authentication Error',
          message: error.message || 'An unexpected error occurred. Please try again.',
          action: 'retry',
          actionText: 'Try Again'
        };
    }
  };

  const details = getErrorDetails(error);

  return (
    <Alert variant="error" className="mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {details.title}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{details.message}</p>
          </div>
          <div className="mt-4">
            {details.action === 'login' && onLogin && (
              <button
                onClick={onLogin}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {details.actionText}
              </button>
            )}
            {details.action === 'retry' && onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {details.actionText}
              </button>
            )}
          </div>
        </div>
      </div>
    </Alert>
  );
}
