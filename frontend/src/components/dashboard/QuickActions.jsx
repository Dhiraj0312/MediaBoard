'use client';

import { useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  ComputerDesktopIcon, 
  PhotoIcon, 
  PlayIcon,
  Cog6ToothIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      name: 'Add Screen',
      description: 'Register a new digital signage screen',
      icon: ComputerDesktopIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      onClick: () => router.push('/screens?action=add')
    },
    {
      name: 'Upload Media',
      description: 'Add new images or videos',
      icon: PhotoIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      onClick: () => router.push('/media?action=upload')
    },
    {
      name: 'Create Playlist',
      description: 'Build a new content playlist',
      icon: PlayIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      onClick: () => router.push('/playlists?action=create')
    },
    {
      name: 'Manage Assignments',
      description: 'Assign playlists to screens',
      icon: Cog6ToothIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100',
      onClick: () => router.push('/assignments')
    }
  ];

  const handleRefreshAll = () => {
    window.location.reload();
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
      </div>
      
      <div className="p-6">
        <div className="space-y-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.name}
                onClick={action.onClick}
                className={`w-full text-left p-4 rounded-lg border border-gray-200 transition-colors ${action.bgColor}`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">{action.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                  </div>
                  <div className="ml-auto">
                    <PlusIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* System actions */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">System Actions</h4>
          <div className="space-y-2">
            <button
              onClick={handleRefreshAll}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh Dashboard
            </button>
          </div>
        </div>

        {/* Help section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Getting Started</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center mr-3 mt-0.5">1</span>
              <span>Add your first screen using the device code</span>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center mr-3 mt-0.5">2</span>
              <span>Upload media files (images or videos)</span>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center mr-3 mt-0.5">3</span>
              <span>Create playlists with your media</span>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center mr-3 mt-0.5">4</span>
              <span>Assign playlists to screens</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}