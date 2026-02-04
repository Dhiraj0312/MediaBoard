'use client';

import { useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';
import { useDashboardData } from '@/hooks/usePolling';
import StatsCards from '@/components/dashboard/StatsCards';
import SystemHealth from '@/components/dashboard/SystemHealth';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import QuickActions from '@/components/dashboard/QuickActions';
import TrendsChart from '@/components/dashboard/TrendsChart';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import PollingStatus from '@/components/common/PollingStatus';

export default function DashboardPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Use the new polling hook for real-time data
  const {
    data: dashboardData,
    error,
    isLoading,
    lastUpdated,
    refresh,
    pause,
    resume,
    getStatus
  } = useDashboardData(apiClient, {
    interval: 300000, // 5 minutes - VERY CONSERVATIVE for production
    onData: (data, meta) => {
      if (meta.hasChanged) {
        console.log('📊 Dashboard data updated');
      }
    },
    onError: (err, meta) => {
      console.error('📊 Dashboard polling error:', err);
      
      // Show user-friendly message for rate limiting
      if (err.response?.status === 429 || err.message?.includes('Too many')) {
        console.warn('🚦 Dashboard polling rate limited - reducing frequency');
      }
    },
    onChange: (newData, oldData, meta) => {
      console.log('📊 Dashboard data changed:', meta);
      // Could show a toast notification here
    }
  });

  const handleRefresh = useCallback(() => {
    refresh();
    setRefreshTrigger(prev => prev + 1);
  }, [refresh]);

  const handlePause = useCallback(() => {
    pause();
  }, [pause]);

  const handleResume = useCallback(() => {
    resume();
  }, [resume]);

  if (isLoading && !dashboardData) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white shadow rounded-lg p-5">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !dashboardData) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Failed to load dashboard data
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error.message}</p>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={handleRefresh}
                      className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleResume}
                      className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                    >
                      Resume Polling
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const pollingStatus = getStatus();

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              {lastUpdated && (
                <p className="text-sm text-gray-500 mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()} • Updates every 5 minutes
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {/* Polling status indicator */}
              <PollingStatus />
              
              {/* Polling controls */}
              <div className="flex items-center space-x-2">
                {pollingStatus?.isActive && !pollingStatus?.isPaused ? (
                  <button
                    onClick={handlePause}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                    </svg>
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={handleResume}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1" />
                    </svg>
                    Resume
                  </button>
                )}
                
                <button
                  onClick={handleRefresh}
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
          </div>

          {/* Connection error banner */}
          {error && dashboardData && (
            <div className={`mb-6 border rounded-md p-4 ${
              error.response?.status === 429 || error.message?.includes('Too many')
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    {error.response?.status === 429 || error.message?.includes('Too many')
                      ? 'Polling Rate Limited'
                      : 'Connection Issue'
                    }
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      {error.response?.status === 429 || error.message?.includes('Too many')
                        ? 'Dashboard updates have been slowed down to prevent server overload. Data will refresh less frequently.'
                        : `Unable to fetch latest data. Showing cached information. ${error.message}`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <StatsCards data={dashboardData?.stats?.stats} />

          {/* System Health & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <SystemHealth data={dashboardData?.health?.health} />
            </div>
            <div>
              <QuickActions />
            </div>
          </div>

          {/* Alerts Panel */}
          {dashboardData?.alerts?.alerts && dashboardData.alerts.alerts.length > 0 && (
            <div className="mb-8">
              <AlertsPanel data={dashboardData.alerts} />
            </div>
          )}

          {/* Trends Chart & Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <TrendsChart data={dashboardData?.stats?.trends} />
            <ActivityFeed data={dashboardData?.activity} />
          </div>

          {/* Polling Status Details (for debugging) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8">
              <PollingStatus showDetails={true} />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}