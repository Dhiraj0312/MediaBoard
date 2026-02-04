'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SkipLinks from '@/components/ui/SkipLinks';
import { useScreenReader } from '@/hooks/useAccessibility';
import { Bars3Icon } from '@heroicons/react/24/outline';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { LiveRegion } = useScreenReader();

  return (
    <ProtectedRoute>
      <div className="h-screen flex overflow-hidden bg-gray-100">
        {/* Skip Links for keyboard navigation */}
        <SkipLinks />
        
        {/* Live region for screen reader announcements */}
        <LiveRegion />
        
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          {/* Mobile header */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between bg-white px-4 py-2 shadow-sm border-b border-gray-200">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar navigation"
                aria-expanded={sidebarOpen}
                aria-controls="sidebar-navigation"
              >
                <Bars3Icon className="w-6 h-6" aria-hidden="true" />
              </button>
              
              <h1 className="text-lg font-semibold text-gray-900">
                Digital Signage
              </h1>
              
              <div className="w-8" aria-hidden="true"></div> {/* Spacer for centering */}
            </div>
          </div>

          {/* Main content */}
          <main 
            id="main-content"
            className="flex-1 relative overflow-y-auto focus:outline-none"
            role="main"
            aria-label="Main content"
            tabIndex="-1"
          >
            <div className="container-responsive py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}