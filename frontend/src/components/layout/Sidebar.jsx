'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Tooltip from '@/components/ui/Tooltip';
import {
  HomeIcon,
  ComputerDesktopIcon,
  PhotoIcon,
  PlayIcon,
  LinkIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    description: 'System overview and statistics'
  },
  {
    name: 'Screens',
    href: '/screens',
    icon: ComputerDesktopIcon,
    description: 'Manage digital signage displays'
  },
  {
    name: 'Media',
    href: '/media',
    icon: PhotoIcon,
    description: 'Upload and manage media files'
  },
  {
    name: 'Playlists',
    href: '/playlists',
    icon: PlayIcon,
    description: 'Create and manage content playlists'
  },
  {
    name: 'Assignments',
    href: '/assignments',
    icon: LinkIcon,
    description: 'Assign playlists to screens'
  },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"></div>
        </div>
      )}

      {/* Sidebar */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 ${sidebarWidth} bg-gray-900 transform transition-all duration-300 ease-in-out 
          lg:translate-x-0 lg:static lg:inset-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 bg-gray-800 px-4">
          {!isCollapsed && (
            <h1 className="text-white text-lg font-semibold truncate">
              Digital Signage
            </h1>
          )}
          
          {/* Desktop collapse toggle */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <Bars3Icon className="h-5 w-5" />
            ) : (
              <XMarkIcon className="h-5 w-5" />
            )}
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-5 px-2 space-y-1" aria-label="Sidebar navigation">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            const linkContent = (
              <Link
                href={item.href}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900
                  ${isActive
                    ? 'bg-gray-800 text-white shadow-sm'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white hover-lift'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                onClick={() => setIsOpen(false)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon 
                  className={`flex-shrink-0 h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`}
                  aria-hidden="true"
                />
                {!isCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
                {isActive && (
                  <div className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-md" aria-hidden="true" />
                )}
              </Link>
            );

            return (
              <div key={item.name}>
                {isCollapsed ? (
                  <Tooltip content={`${item.name} - ${item.description}`} position="right">
                    {linkContent}
                  </Tooltip>
                ) : (
                  linkContent
                )}
              </div>
            );
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-800 border-t border-gray-700">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
            {!isCollapsed && (
              <>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-sm font-medium text-white">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate" title={user?.email}>
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-400">Administrator</p>
                </div>
              </>
            )}
            
            <Tooltip content="Sign out" position={isCollapsed ? 'right' : 'top'}>
              <button
                onClick={handleLogout}
                className={`
                  flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800
                  ${isCollapsed ? '' : 'ml-3'}
                `}
                aria-label="Sign out"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </>
  );
}