'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function MediaPreview({ media, isOpen, onClose, onEdit, onDelete }) {
  const [imageError, setImageError] = useState(false);

  if (!media) return null;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadMedia = () => {
    const link = document.createElement('a');
    link.href = media.url;
    link.download = media.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(media.url);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" showCloseButton={false}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 truncate">
              {media.name}
            </h2>
            <div className="flex items-center space-x-4 mt-2">
              <Badge variant={media.type === 'image' ? 'success' : 'info'}>
                {media.type.toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-500">
                {formatFileSize(media.file_size)}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(media.created_at)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Media Display */}
        <div className="bg-gray-100 rounded-lg overflow-hidden">
          {media.type === 'image' && !imageError ? (
            <img
              src={media.url}
              alt={media.name}
              className="w-full max-h-96 object-contain"
              onError={() => setImageError(true)}
            />
          ) : media.type === 'video' ? (
            <video
              src={media.url}
              controls
              className="w-full max-h-96"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">Preview not available</p>
                <p className="text-sm">File type: {media.mime_type}</p>
              </div>
            </div>
          )}
        </div>

        {/* Media Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">File Information</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">File Name:</dt>
                  <dd className="text-gray-900 font-medium truncate ml-2">{media.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">File Size:</dt>
                  <dd className="text-gray-900">{formatFileSize(media.file_size)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">MIME Type:</dt>
                  <dd className="text-gray-900">{media.mime_type}</dd>
                </div>
                {media.duration && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Duration:</dt>
                    <dd className="text-gray-900">{media.duration}s</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Upload Information</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Created:</dt>
                  <dd className="text-gray-900">{formatDate(media.created_at)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Modified:</dt>
                  <dd className="text-gray-900">{formatDate(media.updated_at)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">ID:</dt>
                  <dd className="text-gray-900 font-mono text-xs">{media.id}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadMedia}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={copyUrl}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy URL
            </Button>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => onEdit(media)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => onDelete(media.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}