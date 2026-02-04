'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/Modal';

export default function MediaCard({ 
  media, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onPreview,
  loading = false,
  selectable = false,
  selected = false,
  onSelect
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileIcon = (type) => {
    if (type === 'image') {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (type === 'video') {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    }
    return null;
  };

  const handleDelete = () => {
    onDelete(media.id);
    setShowDeleteModal(false);
  };

  const handlePreview = () => {
    onPreview?.(media);
  };

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}>
        {/* Media Preview */}
        <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden group">
          {selectable && (
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => onSelect?.(media.id, e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          )}

          {media.type === 'image' && !imageError ? (
            <img
              src={media.url}
              alt={media.name}
              className="w-full h-full object-cover cursor-pointer"
              onClick={handlePreview}
              onError={() => setImageError(true)}
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center text-gray-400 cursor-pointer"
              onClick={handlePreview}
            >
              {getFileIcon(media.type)}
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreview}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white hover:bg-white hover:bg-opacity-20"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </Button>
          </div>

          {/* Type Badge */}
          <div className="absolute top-2 right-2">
            <Badge variant={media.type === 'image' ? 'success' : 'info'} size="sm">
              {media.type}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title and Size */}
          <div className="mb-3">
            <h3 className="text-sm font-medium text-gray-900 truncate" title={media.name}>
              {media.name}
            </h3>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">
                {formatFileSize(media.file_size)}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(media.created_at)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(media)}
                disabled={loading}
                className="text-gray-600 hover:text-gray-800 p-1"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
              
              {onDuplicate && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDuplicate(media.id)}
                  disabled={loading}
                  className="text-gray-600 hover:text-gray-800 p-1"
                  title="Duplicate"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </Button>
              )}
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteModal(true)}
              disabled={loading}
              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1"
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
        title="Delete Media"
        message={`Are you sure you want to delete "${media.name}"? This action cannot be undone and may affect playlists that use this media.`}
        confirmText="Delete Media"
        type="danger"
      />
    </>
  );
}