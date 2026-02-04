'use client';

import { useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';
import { useScreenStatus } from '@/hooks/usePolling';
import ScreensList from '@/components/screens/ScreensList';
import PollingStatus from '@/components/common/PollingStatus';

export default function ScreensPage() {
  // Use real-time polling for screen status
  const {
    data: screens,
    error,
    isLoading,
    lastUpdated,
    refresh,
    pause,
    resume
  } = useScreenStatus(apiClient, {
    interval: 300000, // 5 minutes - VERY CONSERVATIVE for production
    onData: (data, meta) => {
      if (meta.hasChanged) {
        console.log('📺 Screen status updated');
        // Could show a toast notification here
      }
    },
    onError: (err, meta) => {
      console.error('📺 Screen polling error:', err);
    },
    onChange: (newData, oldData, meta) => {
      console.log('📺 Screen data changed');
      // Could highlight changed screens
    }
  });

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Screens</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your digital signage displays
                {lastUpdated && ` • Last updated: ${lastUpdated.toLocaleTimeString()}`}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Polling status */}
              <PollingStatus />
              
              {/* Controls */}
              <button
                onClick={refresh}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <svg className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Connection error banner */}
          {error && screens && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Connection Issue
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Unable to fetch latest screen status. Showing cached information.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Screens List with real-time data */}
          <ScreensList 
            screens={screens}
            loading={isLoading && !screens}
            error={error && !screens ? error : null}
            onRefresh={refresh}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}