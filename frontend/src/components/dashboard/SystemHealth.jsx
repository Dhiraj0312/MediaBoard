'use client';

import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ServerIcon,
  CloudIcon,
  ComputerDesktopIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

export default function SystemHealth({ data }) {
  if (!data) {
    return (
      <div className="bg-white shadow rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gray-200 rounded-full mr-3"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const components = [
    {
      name: 'Database',
      status: data.components?.database?.status || 'unknown',
      icon: ServerIcon,
      details: data.components?.database?.responseTime ? 
        `${data.components.database.responseTime}ms response` : 'No data',
      error: data.components?.database?.error
    },
    {
      name: 'Storage',
      status: data.components?.storage?.status || 'unknown',
      icon: CloudIcon,
      details: data.components?.storage?.responseTime ? 
        `${data.components.storage.responseTime}ms response` : 'No data',
      error: data.components?.storage?.error
    },
    {
      name: 'Screens',
      status: data.components?.screens?.status || 'unknown',
      icon: ComputerDesktopIcon,
      details: data.components?.screens?.metrics ? 
        `${data.components.screens.metrics.online}/${data.components.screens.metrics.total} online` : 'No data',
      connectivityRate: data.components?.screens?.connectivityRate
    },
    {
      name: 'Content',
      status: data.components?.content?.status || 'unknown',
      icon: DocumentIcon,
      details: data.components?.content?.metrics ? 
        `${data.components.content.metrics.activeAssignments} active assignments` : 'No data',
      assignmentRate: data.components?.content?.assignmentRate
    }
  ];

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">System Health</h3>
          <div className="flex items-center">
            {getStatusIcon(data.overall)}
            <span className={`ml-2 text-sm font-medium capitalize ${
              data.overall === 'healthy' ? 'text-green-600' :
              data.overall === 'warning' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {data.overall}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {components.map((component) => {
            const Icon = component.icon;
            return (
              <div key={component.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${getStatusColor(component.status)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="ml-3">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">{component.name}</p>
                      {getStatusIcon(component.status)}
                    </div>
                    <p className="text-xs text-gray-500">{component.details}</p>
                    {component.error && (
                      <p className="text-xs text-red-600 mt-1">{component.error}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {component.connectivityRate !== undefined && (
                    <div className="text-sm font-medium text-gray-900">
                      {component.connectivityRate}%
                    </div>
                  )}
                  {component.assignmentRate !== undefined && (
                    <div className="text-sm font-medium text-gray-900">
                      {component.assignmentRate}%
                    </div>
                  )}
                  <div className={`text-xs capitalize ${
                    component.status === 'healthy' ? 'text-green-600' :
                    component.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {component.status}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Alerts section */}
        {data.alerts && data.alerts.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Active Alerts</h4>
            <div className="space-y-2">
              {data.alerts.slice(0, 3).map((alert, index) => (
                <div key={index} className={`p-3 rounded-md ${
                  alert.type === 'critical' ? 'bg-red-50 border border-red-200' :
                  alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {alert.type === 'critical' ? (
                        <XCircleIcon className="h-4 w-4 text-red-400" />
                      ) : alert.type === 'warning' ? (
                        <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <CheckCircleIcon className="h-4 w-4 text-blue-400" />
                      )}
                    </div>
                    <div className="ml-2">
                      <p className={`text-sm font-medium ${
                        alert.type === 'critical' ? 'text-red-800' :
                        alert.type === 'warning' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {alert.component}
                      </p>
                      <p className={`text-xs ${
                        alert.type === 'critical' ? 'text-red-600' :
                        alert.type === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance metrics */}
        {data.metrics && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Performance Metrics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {data.metrics.performance && (
                <>
                  <div>
                    <span className="text-gray-500">Avg Response Time:</span>
                    <span className="ml-2 font-medium">{data.metrics.performance.averageResponseTime}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Database:</span>
                    <span className="ml-2 font-medium">{data.metrics.performance.databaseResponseTime}ms</span>
                  </div>
                </>
              )}
              {data.metrics.system && (
                <>
                  <div>
                    <span className="text-gray-500">Uptime:</span>
                    <span className="ml-2 font-medium">{Math.round(data.metrics.system.uptime / 3600)}h</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Memory:</span>
                    <span className="ml-2 font-medium">
                      {Math.round((data.metrics.system.memoryUsage.heapUsed / data.metrics.system.memoryUsage.heapTotal) * 100)}%
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}