'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import MediaList from '@/components/media/MediaList';

export default function MediaPage() {
  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MediaList />
        </div>
      </div>
    </DashboardLayout>
  );
}