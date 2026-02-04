'use client';

import { 
  ComputerDesktopIcon, 
  PhotoIcon, 
  PlayIcon,
  Cog6ToothIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function ActivityFeed({ data }) {
  if (!data) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start">
                <div className="h-8 w-8 bg-gray-200 rounded-full mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getActivityIcon = (type, subtype) => {
    const iconClass = "h-5 w-5";
    
    switch (type) {
      case 'screen':
        return <ComputerDesktopIcon className={`${iconClass} text-blue-500`} />;
      case 'media':
        return <PhotoIcon className={`${iconClass} text-purple-500`} />;
      case 'playlist':
        return <PlayIcon className={`${iconClass} text-green-500`} />;
      case 'assignment':
        return <Cog6ToothIcon className={`${iconClass} text-indigo-500`} />;
      default:
        return <ClockIcon className={`${iconClass} text-gray-500`} />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'screen':
        return 'bg-blue-50 border-blue-200';
      case 'media':
        return 'bg-purple-50 border-purple-200';
      case 'playlist':
        return 'bg-green-50 border-green-200';
      case 'assignment':
        return 'bg-indigo-50 border-indigo-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const activities = data.activity || [];

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          {data.stats && (
            <span className="text-sm text-gray-500">
              {data.stats.total} activities
            </span>
          )}
        </div>
      </div>
      
      <div className="p-6">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-sm font-medium text-gray-900 mb-2">No recent activity</h4>
            <p className="text-sm text-gray-500">
              Activity will appear here as you use the system
            </p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.map((activity, index) => (
                <li key={`${activity.type}-${activity.timestamp}-${index}`}>
                  <div className="relative pb-8">
                    {index !== activities.length - 1 && (
                      <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    )}
                    <div className="relative flex items-start space-x-3">
                      <div className={`relative px-1 py-1 rounded-full border ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type, activity.subtype)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">
                              {activity.title}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {activity.details}
                          </p>
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="text-xs text-gray-400">
                              {formatTimeAgo(activity.timestamp)}
                            </span>
                            {activity.metadata?.isNew && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                New
                              </span>
                            )}
                            {activity.metadata?.isRecent && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Recent
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Activity stats */}
        {data.stats && data.stats.byType && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Activity Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(data.stats.byType).map(([type, count]) => (
                <div key={type} className="flex items-center">
                  <div className="flex-shrink-0 mr-2">
                    {getActivityIcon(type)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 capitalize">{type}</div>
                    <div className="text-xs text-gray-500">{count} activities</div>
                  </div>
                </div>
              ))}
            </div>
            
            {data.stats.recentCount > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 text-blue-400 mr-2" />
                  <span className="text-sm text-blue-800">
                    {data.stats.recentCount} activities in the last hour
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}