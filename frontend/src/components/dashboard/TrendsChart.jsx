'use client';

import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  MinusIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function TrendsChart({ data }) {
  if (!data) {
    return (
      <div className="bg-white shadow rounded-lg animate-pulse">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getTrendIcon = (current, previous) => {
    if (current > previous) {
      return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
    } else if (current < previous) {
      return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
    }
    return <MinusIcon className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (current, previous) => {
    if (current > previous) {
      return 'text-green-600';
    } else if (current < previous) {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const trends = [
    {
      name: 'New Screens',
      current: data.screens?.growth?.thisWeek || 0,
      previous: data.screens?.growth?.thisMonth - data.screens?.growth?.thisWeek || 0,
      description: 'Screens added this week',
      color: 'blue'
    },
    {
      name: 'Media Uploads',
      current: data.media?.uploads?.thisWeek || 0,
      previous: data.media?.uploads?.lastWeek || 0,
      description: 'Files uploaded this week',
      color: 'purple'
    },
    {
      name: 'Playlist Updates',
      current: data.playlists?.updates?.thisWeek || 0,
      previous: 0, // We don't have last week data for updates
      description: 'Playlists modified this week',
      color: 'green'
    },
    {
      name: 'New Assignments',
      current: data.assignments?.growth?.thisWeek || 0,
      previous: data.assignments?.growth?.thisMonth - data.assignments?.growth?.thisWeek || 0,
      description: 'Screen assignments this week',
      color: 'indigo'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <ChartBarIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Trends & Growth</h3>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-6">
          {trends.map((trend) => {
            const percentageChange = calculatePercentageChange(trend.current, trend.previous);
            
            return (
              <div key={trend.name} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{trend.name}</h4>
                    <p className="text-xs text-gray-500">{trend.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-gray-900">
                      {trend.current}
                    </div>
                    {trend.previous > 0 && (
                      <div className="flex items-center justify-end">
                        {getTrendIcon(trend.current, trend.previous)}
                        <span className={`ml-1 text-sm font-medium ${getTrendColor(trend.current, trend.previous)}`}>
                          {Math.abs(percentageChange)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>This Week</span>
                    <span>vs Previous</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        trend.color === 'blue' ? 'bg-blue-500' :
                        trend.color === 'purple' ? 'bg-purple-500' :
                        trend.color === 'green' ? 'bg-green-500' : 'bg-indigo-500'
                      }`}
                      style={{ 
                        width: `${Math.min(Math.max((trend.current / Math.max(trend.current, trend.previous, 1)) * 100, 10), 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Comparison */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    Current: <span className="font-medium">{trend.current}</span>
                  </span>
                  <span className="text-gray-600">
                    Previous: <span className="font-medium">{trend.previous}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary cards */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Growth Summary</h4>
          <div className="grid grid-cols-2 gap-3">
            {trends.map((trend) => {
              const percentageChange = calculatePercentageChange(trend.current, trend.previous);
              return (
                <div key={`summary-${trend.name}`} className={`p-3 rounded-lg border ${getColorClasses(trend.color)}`}>
                  <div className="text-xs font-medium">{trend.name}</div>
                  <div className="flex items-center mt-1">
                    <span className="text-lg font-semibold">{trend.current}</span>
                    {trend.previous > 0 && (
                      <div className="ml-2 flex items-center">
                        {getTrendIcon(trend.current, trend.previous)}
                        <span className="ml-1 text-xs font-medium">
                          {Math.abs(percentageChange)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity indicators */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Activity Indicators</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Screen Activity</span>
              <span className="font-medium">
                {data.screens?.activity?.activeToday || 0} active today
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Content Growth</span>
              <span className="font-medium">
                {data.media?.growth?.thisWeek || 0} new files this week
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Playlist Activity</span>
              <span className="font-medium">
                {data.playlists?.creation?.thisWeek || 0} created this week
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}