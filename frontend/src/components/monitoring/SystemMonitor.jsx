'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { 
  CpuChipIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function SystemMonitor({ className = '' }) {
  const [healthData, setHealthData] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const [alertsData, setAlertsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMonitoringData = async () => {
    try {
      const [healthResponse, metricsResponse, alertsResponse] = await Promise.all([
        apiClient.request('/api/monitoring/health'),
        apiClient.request('/api/monitoring/metrics'),
        apiClient.request('/api/monitoring/alerts')
      ]);

      setHealthData(healthResponse.health);
      setMetricsData(metricsResponse.metrics);
      setAlertsData(alertsResponse.alerts);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch monitoring data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();

    // Refresh every 5 minutes - VERY CONSERVATIVE for production
    const interval = setInterval(fetchMonitoringData, 300000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'critical':
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatUptime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Monitoring Unavailable</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchMonitoringData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">System Monitor</h3>
          <div className="flex items-center space-x-2">
            {getStatusIcon(healthData?.overall)}
            <span className={`text-sm font-medium capitalize ${
              healthData?.overall === 'healthy' ? 'text-green-600' :
              healthData?.overall === 'warning' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {healthData?.overall || 'Unknown'}
            </span>
          </div>
        </div>
        {lastUpdated && (
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="p-6">
        {/* System Health Components */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Component Health</h4>
          <div className="grid grid-cols-2 gap-3">
            {healthData?.components && Object.entries(healthData.components).map(([name, component]) => (
              <div key={name} className={`p-3 rounded-lg border ${getStatusColor(component.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-2">
                      {name === 'database' && <ServerIcon className="h-4 w-4" />}
                      {name === 'memory' && <CpuChipIcon className="h-4 w-4" />}
                      {name === 'cpu' && <ChartBarIcon className="h-4 w-4" />}
                      {!['database', 'memory', 'cpu'].includes(name) && getStatusIcon(component.status)}
                    </div>
                    <span className="text-sm font-medium capitalize">{name}</span>
                  </div>
                  {getStatusIcon(component.status)}
                </div>
                {component.responseTime && (
                  <div className="text-xs mt-1">{component.responseTime}ms</div>
                )}
                {component.usagePercent && (
                  <div className="text-xs mt-1">{component.usagePercent}% usage</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        {metricsData && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Performance Metrics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Uptime:</span>
                <span className="ml-2 font-medium">{formatUptime(metricsData.uptime)}</span>
              </div>
              <div>
                <span className="text-gray-500">Requests:</span>
                <span className="ml-2 font-medium">{metricsData.requests?.total || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Avg Response:</span>
                <span className="ml-2 font-medium">{metricsData.requests?.averageResponseTime || 0}ms</span>
              </div>
              <div>
                <span className="text-gray-500">Error Rate:</span>
                <span className={`ml-2 font-medium ${
                  (metricsData.requests?.errorRate || 0) > 0.1 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {((metricsData.requests?.errorRate || 0) * 100).toFixed(1)}%
                </span>
              </div>
              {metricsData.system && (
                <>
                  <div>
                    <span className="text-gray-500">Memory:</span>
                    <span className="ml-2 font-medium">
                      {formatBytes(metricsData.system.memory?.process?.heapUsed || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">CPU:</span>
                    <span className="ml-2 font-medium">
                      {(metricsData.system.cpu?.process?.usagePercent || 0).toFixed(1)}%
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Active Alerts */}
        {alertsData && alertsData.total > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Active Alerts ({alertsData.total})
            </h4>
            <div className="space-y-2">
              {alertsData.items.slice(0, 5).map((alert, index) => (
                <div key={index} className={`p-2 rounded border ${
                  alert.severity === 'critical' ? 'bg-red-50 border-red-200 text-red-800' :
                  alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                  'bg-blue-50 border-blue-200 text-blue-800'
                }`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-2">
                      {alert.severity === 'critical' ? (
                        <XCircleIcon className="h-4 w-4 text-red-500" />
                      ) : alert.severity === 'warning' ? (
                        <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <CheckCircleIcon className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.component}</p>
                      <p className="text-xs">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}
              {alertsData.total > 5 && (
                <div className="text-xs text-gray-500 text-center">
                  And {alertsData.total - 5} more alerts...
                </div>
              )}
            </div>
          </div>
        )}

        {/* No alerts message */}
        {alertsData && alertsData.total === 0 && (
          <div className="text-center py-4">
            <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No active alerts</p>
          </div>
        )}
      </div>
    </div>
  );
}