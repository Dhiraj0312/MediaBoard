'use client';

import { useState } from 'react';
import { usePollingStatus } from '@/hooks/usePolling';
import { 
  WifiIcon, 
  PauseIcon, 
  PlayIcon, 
  StopIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function PollingStatus({ showDetails = false, className = '' }) {
  const { status, pauseAll, resumeAll, stopAll } = usePollingStatus();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!status) {
    return null;
  }

  const getStatusColor = () => {
    if (!status.isOnline) return 'text-red-500';
    if (status.errorPollers > 0) return 'text-yellow-500';
    if (status.activePollers > 0) return 'text-green-500';
    return 'text-gray-500';
  };

  const getStatusIcon = () => {
    const iconClass = `h-4 w-4 ${getStatusColor()}`;
    
    if (!status.isOnline) {
      return <WifiIcon className={`${iconClass} opacity-50`} />;
    }
    if (status.errorPollers > 0) {
      return <ExclamationTriangleIcon className={iconClass} />;
    }
    if (status.activePollers > 0) {
      return <CheckCircleIcon className={iconClass} />;
    }
    return <ClockIcon className={iconClass} />;
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  if (!showDetails) {
    // Compact status indicator
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getStatusIcon()}
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {status.activePollers} active
        </span>
        {status.errorPollers > 0 && (
          <span className="text-xs text-red-500">
            {status.errorPollers} errors
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <h3 className="text-sm font-medium text-gray-900">Polling Status</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? 'Hide' : 'Show'} Details
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{status.totalPollers}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{status.activePollers}</div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-600">{status.pausedPollers}</div>
            <div className="text-xs text-gray-500">Paused</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{status.errorPollers}</div>
            <div className="text-xs text-gray-500">Errors</div>
          </div>
        </div>

        {/* Network status */}
        <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded">
          <div className="flex items-center space-x-2">
            <WifiIcon className={`h-4 w-4 ${status.isOnline ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-sm font-medium">
              {status.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={pauseAll}
            disabled={status.activePollers === 0}
            className="flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PauseIcon className="h-3 w-3 mr-1" />
            Pause All
          </button>
          <button
            onClick={resumeAll}
            disabled={status.pausedPollers === 0}
            className="flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlayIcon className="h-3 w-3 mr-1" />
            Resume All
          </button>
          <button
            onClick={stopAll}
            disabled={status.totalPollers === 0}
            className="flex items-center px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <StopIcon className="h-3 w-3 mr-1" />
            Stop All
          </button>
        </div>

        {/* Detailed status */}
        {isExpanded && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Poller Details</h4>
            {Object.entries(status.pollers).map(([id, pollerStatus]) => (
              <div key={id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    pollerStatus.hasError ? 'bg-red-500' :
                    pollerStatus.isPaused ? 'bg-yellow-500' :
                    pollerStatus.isActive ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="font-medium">{id}</span>
                </div>
                <div className="flex items-center space-x-4 text-gray-600">
                  <span>{pollerStatus.currentInterval}ms</span>
                  <span>
                    {pollerStatus.consecutiveErrors > 0 && (
                      <span className="text-red-600">{pollerStatus.consecutiveErrors} errors</span>
                    )}
                    {pollerStatus.consecutiveSuccesses > 0 && pollerStatus.consecutiveErrors === 0 && (
                      <span className="text-green-600">{pollerStatus.consecutiveSuccesses} success</span>
                    )}
                  </span>
                  <span>{formatLastUpdate(pollerStatus.lastSuccessTime)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}