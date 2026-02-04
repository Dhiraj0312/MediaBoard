'use client';

import { 
  ComputerDesktopIcon, 
  CheckCircleIcon, 
  PhotoIcon, 
  PlayIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

export default function StatsCards({ data }) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 bg-gray-200 rounded"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const { screens, media, playlists, assignments, system } = data;

  const stats = [
    {
      name: 'Total Screens',
      value: screens?.total || 0,
      change: screens?.newThisWeek || 0,
      changeType: 'increase',
      icon: ComputerDesktopIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      subtitle: `${screens?.online || 0} online, ${screens?.offline || 0} offline`,
      trend: screens?.connectivityRate || 0
    },
    {
      name: 'Online Screens',
      value: screens?.online || 0,
      change: screens?.recentlyActive || 0,
      changeType: 'neutral',
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      subtitle: `${screens?.connectivityRate || 0}% connectivity rate`,
      trend: screens?.connectivityRate || 0
    },
    {
      name: 'Media Files',
      value: media?.total || 0,
      change: media?.uploadTrend?.thisWeek || 0,
      changeType: media?.uploadTrend?.thisWeek > media?.uploadTrend?.lastWeek ? 'increase' : 'decrease',
      icon: PhotoIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      subtitle: `${media?.totalSizeFormatted || '0 B'} total size`,
      trend: media?.uploadTrend?.thisWeek || 0
    },
    {
      name: 'Active Playlists',
      value: playlists?.withContent || 0,
      change: playlists?.newThisWeek || 0,
      changeType: 'increase',
      icon: PlayIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      subtitle: `${assignments?.total || 0} assignments`,
      trend: assignments?.assignmentRate || 0
    }
  ];

  const getChangeIcon = (changeType) => {
    if (changeType === 'increase') {
      return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
    } else if (changeType === 'decrease') {
      return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-2 rounded-md ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value.toLocaleString()}
                      </div>
                      {stat.change > 0 && (
                        <div className="ml-2 flex items-baseline text-sm font-semibold">
                          {getChangeIcon(stat.changeType)}
                          <span className={`ml-1 ${
                            stat.changeType === 'increase' ? 'text-green-600' : 
                            stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {stat.change}
                          </span>
                        </div>
                      )}
                    </dd>
                    <dd className="text-xs text-gray-500 mt-1">
                      {stat.subtitle}
                    </dd>
                    {stat.trend !== undefined && (
                      <dd className="mt-2">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                stat.trend >= 80 ? 'bg-green-500' :
                                stat.trend >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(stat.trend, 100)}%` }}
                            ></div>
                          </div>
                          <span className={`ml-2 text-xs font-medium ${getHealthColor(stat.trend)}`}>
                            {stat.trend}%
                          </span>
                        </div>
                      </dd>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* System Health Card */}
      <div className="md:col-span-2 lg:col-span-4 bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-2 rounded-md ${
                system?.healthScore >= 80 ? 'bg-green-50' :
                system?.healthScore >= 60 ? 'bg-yellow-50' : 'bg-red-50'
              }`}>
                {system?.healthScore >= 80 ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <ExclamationTriangleIcon className={`h-6 w-6 ${
                    system?.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                )}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">System Health</h3>
                <p className="text-sm text-gray-500">
                  Overall system status: <span className={`font-medium ${getHealthColor(system?.healthScore || 0)}`}>
                    {system?.status || 'Unknown'}
                  </span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getHealthColor(system?.healthScore || 0)}`}>
                {system?.healthScore || 0}%
              </div>
              <div className="text-sm text-gray-500">Health Score</div>
            </div>
          </div>
          
          {/* Health metrics bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>System Performance</span>
              <span>{system?.healthScore || 0}% Healthy</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  system?.healthScore >= 80 ? 'bg-green-500' :
                  system?.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(system?.healthScore || 0, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}