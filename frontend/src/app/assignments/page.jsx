'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import AssignmentList from '@/components/assignments/AssignmentList';

export default function AssignmentsPage() {
  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AssignmentList />
        </div>
      </div>
    </DashboardLayout>
  );
}