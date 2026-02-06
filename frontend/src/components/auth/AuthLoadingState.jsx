'use client';

import React from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function AuthLoadingState({ message = 'Authenticating...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm text-gray-600">{message}</p>
    </div>
  );
}
