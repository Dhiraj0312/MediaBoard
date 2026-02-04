'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import MediaCard from './MediaCard';
import MediaUpload from './MediaUpload';
import MediaPreview from './MediaPreview';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/Modal';

export default function MediaList() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [editingMedia, setEditingMedia] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Fetch media
  const fetchMedia = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...filters,
        type: filters.type === 'all' ? undefined : filters.type
      };

      const response = await apiClient.getMedia(params);
      setMedia(response.media || []);
      setPagination(response.pagination || pagination);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch media:', err);
      setError('Failed to load media. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [filters]);

  // Handle upload complete
  const handleUploadComplete = (uploadedMedia) => {
    setMedia(prev => [...uploadedMedia, ...prev]);
    setShowUploadModal(false);
  };

  // Handle media edit
  const handleEditMedia = async (mediaData) => {
    try {
      setActionLoading(true);
      const response = await apiClient.updateMedia(editingMedia.id, mediaData);
      setMedia(prev => prev.map(item => 
        item.id === editingMedia.id ? response.media : item
      ));
      setEditingMedia(null);
      setError(null);
    } catch (err) {
      console.error('Failed to update media:', err);
      setError(err.message || 'Failed to update media');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle media delete
  const handleDeleteMedia = async (mediaId) => {
    try {
      setActionLoading(true);
      await apiClient.deleteMedia(mediaId);
      setMedia(prev => prev.filter(item => item.id !== mediaId));
      setPreviewMedia(null);
      setError(null);
    } catch (err) {
      console.error('Failed to delete media:', err);
      setError(err.message || 'Failed to delete media');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle media duplicate
  const handleDuplicateMedia = async (mediaId) => {
    try {
      setActionLoading(true);
      const response = await apiClient.request(`/api/media/${mediaId}/duplicate`, {
        method: 'POST'
      });
      setMedia(prev => [response.media, ...prev]);
      setError(null);
    } catch (err) {
      console.error('Failed to duplicate media:', err);
      setError(err.message || 'Failed to duplicate media');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      setActionLoading(true);
      const mediaIds = Array.from(selectedMedia);
      await apiClient.request('/api/media/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ mediaIds })
      });
      setMedia(prev => prev.filter(item => !selectedMedia.has(item.id)));
      setSelectedMedia(new Set());
      setShowBulkDeleteModal(false);
      setError(null);
    } catch (err) {
      console.error('Failed to delete media:', err);
      setError(err.message || 'Failed to delete media');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle selection
  const handleSelectMedia = (mediaId, selected) => {
    setSelectedMedia(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(mediaId);
      } else {
        newSet.delete(mediaId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedMedia(new Set(media.map(item => item.id)));
    } else {
      setSelectedMedia(new Set());
    }
  };

  // Calculate stats
  const stats = {
    total: pagination.total,
    images: media.filter(m => m.type === 'image').length,
    videos: media.filter(m => m.type === 'video').length
  };

  if (loading && media.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Media Library</h1>
          <div className="mt-2 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Badge variant="success">Images</Badge>
              <span className="text-sm text-gray-600">{stats.images}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="info">Videos</Badge>
              <span className="text-sm text-gray-600">{stats.videos}</span>
            </div>
            <span className="text-sm text-gray-500">
              Total: {stats.total}
            </span>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          {selectedMedia.size > 0 && (
            <Button
              variant="danger"
              onClick={() => setShowBulkDeleteModal(true)}
              disabled={actionLoading}
            >
              Delete Selected ({selectedMedia.size})
            </Button>
          )}
          <Button onClick={() => setShowUploadModal(true)}>
            Upload Media
          </Button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search media by name..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        
        <div className="flex gap-3">
          <select
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setFilters(prev => ({ ...prev, sortBy, sortOrder }));
            }}
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="file_size-desc">Largest First</option>
            <option value="file_size-asc">Smallest First</option>
          </select>

          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'grid' 
                  ? 'bg-blue-50 text-blue-600 border-r border-gray-300' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'list' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Selection Controls */}
      {media.length > 0 && (
        <div className="flex items-center space-x-4 text-sm">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedMedia.size === media.length && media.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">
              Select All ({selectedMedia.size} selected)
            </span>
          </label>
        </div>
      )}

      {/* Media Grid/List */}
      {media.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filters.search || filters.type !== 'all' ? 'No media found' : 'No media files'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search || filters.type !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by uploading your first media file.'
            }
          </p>
          {(!filters.search && filters.type === 'all') && (
            <div className="mt-6">
              <Button onClick={() => setShowUploadModal(true)}>
                Upload Media
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
            : 'space-y-4'
        }>
          {media.map((mediaItem) => (
            <MediaCard
              key={mediaItem.id}
              media={mediaItem}
              onEdit={setEditingMedia}
              onDelete={handleDeleteMedia}
              onDuplicate={handleDuplicateMedia}
              onPreview={setPreviewMedia}
              loading={actionLoading}
              selectable={true}
              selected={selectedMedia.has(mediaItem.id)}
              onSelect={handleSelectMedia}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Media Files"
        size="lg"
      >
        <MediaUpload
          onUploadComplete={handleUploadComplete}
          onClose={() => setShowUploadModal(false)}
        />
      </Modal>

      {/* Preview Modal */}
      <MediaPreview
        media={previewMedia}
        isOpen={!!previewMedia}
        onClose={() => setPreviewMedia(null)}
        onEdit={setEditingMedia}
        onDelete={handleDeleteMedia}
      />

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingMedia}
        onClose={() => setEditingMedia(null)}
        title="Edit Media"
        size="md"
      >
        {editingMedia && (
          <div className="space-y-4">
            <Input
              label="Media Name"
              value={editingMedia.name}
              onChange={(e) => setEditingMedia(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setEditingMedia(null)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleEditMedia({ name: editingMedia.name })}
                loading={actionLoading}
                disabled={actionLoading}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Media"
        message={`Are you sure you want to delete ${selectedMedia.size} media file${selectedMedia.size > 1 ? 's' : ''}? This action cannot be undone and may affect playlists that use these media files.`}
        confirmText={`Delete ${selectedMedia.size} File${selectedMedia.size > 1 ? 's' : ''}`}
        type="danger"
      />
    </div>
  );
}