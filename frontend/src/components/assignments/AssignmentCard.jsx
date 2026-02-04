'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/Modal';

export default function AssignmentCard({ 
  assignment, 
  onEdit, 
  onDelete,
  loading = false,
  selectable = false,
  selected = false,
  onSelect
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = () => {
    onDelete(assignment.id);
    setShowDeleteModal(false);
  };

  const getStatusColor = (isOnline) => {
    return isOnline ? 'success' : 'danger';
  };

  const getStatusText = (isOnline) => {
    return isOnline ? 'Online' : 'Offline';
  };

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            {selectable && (
              <div className="flex-shrink-0 mr-3">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => onSelect?.(assignment.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {assignment.screen.name}
                </h3>
              </div>
              {assignment.screen.location && (
                <p className="text-sm text-gray-500 mt-1">
                  📍 {assignment.screen.location}
                </p>
              )}
            </div>

            <Badge variant={getStatusColor(assignment.isScreenOnline)}>
              {getStatusText(assignment.isScreenOnline)}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Playlist Info */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span className="text-sm font-medium text-gray-900">Assigned Playlist</span>
            </div>
            <p className="text-base font-medium text-blue-600 truncate" title={assignment.playlist.name}>
              {assignment.playlist.name}
            </p>
            {assignment.playlist.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2" title={assignment.playlist.description}>
                {assignment.playlist.description}
              </p>
            )}
          </div>

          {/* Assignment Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Device Code:</span>
              <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                {assignment.screen.device_code}
              </code>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Assigned:</span>
              <span className="text-gray-900">
                {formatDate(assignment.assigned_at)}
              </span>
            </div>

            {assignment.lastSeen && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Last Seen:</span>
                <span className="text-gray-900">
                  {assignment.lastSeen}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(assignment)}
                disabled={loading}
              >
                Edit
              </Button>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteModal(true)}
              disabled={loading}
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              Remove
            </Button>
          </div>
        </div>

        {/* Connection Status Indicator */}
        <div className={`h-1 w-full ${
          assignment.isScreenOnline ? 'bg-green-400' : 'bg-red-400'
        }`}></div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Remove Assignment"
        message={`Are you sure you want to remove the assignment of "${assignment.playlist.name}" from "${assignment.screen.name}"? This will stop content playback on this screen.`}
        confirmText="Remove Assignment"
        type="danger"
      />
    </>
  );
}