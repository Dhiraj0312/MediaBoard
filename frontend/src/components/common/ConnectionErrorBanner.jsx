'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

export function ConnectionErrorBanner() {
  const { backendAvailable, backendError, checkBackendHealth } = useAuth();
  const [retrying, setRetrying] = React.useState(false);

  if (backendAvailable) {
    return null;
  }

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await checkBackendHealth();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <Alert variant="error" className="rounded-none border-x-0 border-t-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Backend Connection Error</h3>
            <p className="text-sm">
              {backendError || 'Unable to connect to the backend server.'}
            </p>
            <p className="text-sm mt-2">
              <strong>To start the backend:</strong>
            </p>
            <ol className="text-sm mt-1 ml-4 list-decimal">
              <li>Open a terminal in the project root</li>
              <li>Navigate to the backend directory: <code className="bg-black/10 px-1 rounded">cd backend</code></li>
              <li>Run: <code className="bg-black/10 px-1 rounded">npm run dev</code></li>
            </ol>
          </div>
          <Button
            onClick={handleRetry}
            disabled={retrying}
            variant="secondary"
            size="sm"
          >
            {retrying ? 'Retrying...' : 'Retry Connection'}
          </Button>
        </div>
      </Alert>
    </div>
  );
}
