'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/Modal';

export default function PlaylistCard({ 
  playlist, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onBuild,
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
      day: 'numeric'
    });
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleDelete = () => {
    onDelete(playlist.id);
    setShowDeleteModal(false);
  };

  const getPreviewImages = () => {
    const imageItems = playlist.items
      .filter(item => item.media.type === 'image')
      .slice(0, 4);
    return imageItems;
  };

  const previewImages = getPreviewImages();

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}>
        {/* Preview Section */}
        <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
          {selectable && (
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => onSelect?.(playlist.id, e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          )}

          {previewImages.length > 0 ? (
            <div className={`grid h-full ${
              previewImages.length === 1 ? 'grid-cols-1' :
              previewImages.length === 2 ? 'grid-cols-2' :
              previewImages.length === 3 ? 'grid-cols-2' : 'grid-cols-2'
            }`}>
              {previewImages.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`relative ${
                    previewImages.length === 3 && index === 0 ? 'row-span-2' : ''
                  }`}
                >
                  <img
                    src={item.media.url}
                    alt={item.media.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <p className="text-sm">Empty Playlist</p>
              </div>
            </div>
          )}

          {/* Item Count Badge */}
          <div className="absolute top-2 right-2">
            <Badge variant="primary" size="sm">
              {playlist.totalItems} item{playlist.totalItems !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Build Button Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBuild?.(playlist)}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Build
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title and Description */}
          <div className="mb-3">
            <h3 className="text-lg font-medium text-gray-900 truncate" title={playlist.name}>
              {playlist.name}
            </h3>
            {playlist.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2" title={playlist.description}>
                {playlist.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Duration:</span>
              <span className="text-gray-900 font-medium">
                {formatDuration(playlist.totalDuration)}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Created:</span>
              <span className="text-gray-900">
                {formatDate(playlist.created_at)}
              </span>
            </div>

            {playlist.totalItems > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Media Types:</span>
                <div className="flex space-x-1">
                  {playlist.items.some(item => item.media.type === 'image') && (
                    <Badge variant="success" size="sm">Images</Badge>
                  )}
                  {playlist.items.some(item => item.media.type === 'video') && (
                    <Badge variant="info" size="sm">Videos</Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(playlist)}
                disabled={loading}
              >
                Edit
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDuplicate?.(playlist.id)}
                disabled={loading}
                className="text-gray-600 hover:text-gray-800"
                title="Duplicate"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </Button>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteModal(true)}
              disabled={loading}
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Playlist"
        message={`Are you sure you want to delete "${playlist.name}"? This action cannot be undone and may affect screen assignments.`}
        confirmText="Delete Playlist"
        type="danger"
      />
    </>
  );
}