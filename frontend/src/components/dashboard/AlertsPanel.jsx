'use client';

import { 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function AlertsPanel({ data }) {
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  if (!data || !data.alerts || data.alerts.length === 0) {
    return null;
  }

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertColors = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const dismissAlert = (alertId) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const visibleAlerts = data.alerts.filter(alert => !dismissedAlerts.has(alert.id));

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">System Alerts</h3>
          <div className="flex items-center space-x-2">
            {data.stats && (
              <>
                {data.stats.bySeverity.critical > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {data.stats.bySeverity.critical} Critical
                  </span>
                )}
                {data.stats.bySeverity.warning > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {data.stats.bySeverity.warning} Warning
                  </span>
                )}
                {data.stats.bySeverity.info > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {data.stats.bySeverity.info} Info
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {visibleAlerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColors(alert.severity)}`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getAlertIcon(alert.severity)}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium">{alert.title}</h4>
                      <p className="text-sm mt-1 opacity-90">{alert.message}</p>
                      <div className="mt-2 flex items-center space-x-4 text-xs opacity-75">
                        <span className="capitalize">{alert.type}</span>
                        <span>•</span>
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        {alert.metadata && (
                          <>
                            <span>•</span>
                            <span>
                              {alert.metadata.screenName && `Screen: ${alert.metadata.screenName}`}
                              {alert.metadata.playlistName && `Playlist: ${alert.metadata.playlistName}`}
                              {alert.metadata.location && `Location: ${alert.metadata.location}`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Alert summary */}
        {data.stats && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-semibold text-red-600">
                  {data.stats.bySeverity.critical || 0}
                </div>
                <div className="text-xs text-gray-500">Critical</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-yellow-600">
                  {data.stats.bySeverity.warning || 0}
                </div>
                <div className="text-xs text-gray-500">Warning</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-blue-600">
                  {data.stats.bySeverity.info || 0}
                </div>
                <div className="text-xs text-gray-500">Info</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent alerts indicator */}
        {data.stats && data.stats.recent > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 text-orange-400 mr-2" />
              <span className="text-sm text-orange-800">
                {data.stats.recent} new alerts in the last hour
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}