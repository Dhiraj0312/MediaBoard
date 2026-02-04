'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import PlaylistList from '@/components/playlists/PlaylistList';

export default function PlaylistsPage() {
  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PlaylistList />
        </div>
      </div>
    </DashboardLayout>
  );
}