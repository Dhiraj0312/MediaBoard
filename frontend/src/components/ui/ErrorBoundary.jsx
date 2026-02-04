'use client';

import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import Card from './Card';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    if (typeof window !== 'undefined' && window.console) {
      console.error('🚨 Error Boundary caught an error:', error, errorInfo);
    }

    // Report to external error tracking service if available
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <Card.Body className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {this.props.title || 'Something went wrong'}
              </h3>
              
              <p className="text-sm text-gray-600 mb-6">
                {this.props.message || 'An unexpected error occurred. Please try again or contact support if the problem persists.'}
              </p>

              {/* Error details (development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mb-6 p-4 bg-gray-100 rounded-md">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer mb-2">
                    Error Details
                  </summary>
                  <div className="text-xs text-gray-600 font-mono">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleRetry}
                  variant="primary"
                  className="flex-1 sm:flex-none"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  Reload Page
                </Button>
              </div>

              {this.state.retryCount > 0 && (
                <p className="text-xs text-gray-500 mt-4">
                  Retry attempts: {this.state.retryCount}
                </p>
              )}
            </Card.Body>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const handleError = (error, errorInfo) => {
    console.error('🚨 Error caught by hook:', error, errorInfo);
    
    // Could integrate with toast notifications
    if (typeof window !== 'undefined' && window.toast) {
      window.toast.error('An error occurred. Please try again.');
    }
  };

  return handleError;
};

export default ErrorBoundary;