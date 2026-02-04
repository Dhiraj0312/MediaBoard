'use client';

import { useState } from 'react';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';

export default function ScreenCard({ 
  screen, 
  onEdit, 
  onDelete, 
  onRegenerateCode,
  loading = false 
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  const formatLastSeen = (lastHeartbeat) => {
    if (!lastHeartbeat) return 'Never';
    
    const now = new Date();
    const lastSeen = new Date(lastHeartbeat);
    const diffMs = now - lastSeen;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleDelete = () => {
    onDelete(screen.id);
    setShowDeleteModal(false);
  };

  const handleRegenerateCode = () => {
    onRegenerateCode(screen.id);
    setShowRegenerateModal(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {screen.name}
              </h3>
              {screen.location && (
                <p className="text-sm text-gray-500 mt-1 truncate">
                  📍 {screen.location}
                </p>
              )}
            </div>
            <StatusBadge status={screen.status} />
          </div>

          {/* Device Info */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Device Code:</span>
              <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                {screen.device_code}
              </code>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Last Seen:</span>
              <span className="text-gray-900">
                {formatLastSeen(screen.last_heartbeat)}
              </span>
            </div>

            {screen.assignedPlaylist && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Playlist:</span>
                <span className="text-blue-600 font-medium truncate max-w-32">
                  {screen.assignedPlaylist.name}
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
                onClick={() => onEdit(screen)}
                disabled={loading}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowRegenerateModal(true)}
                disabled={loading}
                className="text-gray-600 hover:text-gray-800"
              >
                🔄 Regenerate Code
              </Button>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteModal(true)}
              disabled={loading}
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              🗑️ Delete
            </Button>
          </div>
        </div>

        {/* Connection Status Indicator */}
        <div className={`h-1 w-full ${
          screen.status === 'online' ? 'bg-green-400' : 'bg-red-400'
        }`}></div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Screen"
        message={`Are you sure you want to delete "${screen.name}"? This action cannot be undone and will remove all playlist assignments.`}
        confirmText="Delete Screen"
        type="danger"
      />

      {/* Regenerate Code Confirmation Modal */}
      <ConfirmModal
        isOpen={showRegenerateModal}
        onClose={() => setShowRegenerateModal(false)}
        onConfirm={handleRegenerateCode}
        title="Regenerate Device Code"
        message={`Are you sure you want to regenerate the device code for "${screen.name}"? The current device code will no longer work and you'll need to update the player with the new code.`}
        confirmText="Regenerate Code"
        type="warning"
      />
    </>
  );
}