'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import PlaylistCard from './PlaylistCard';
import PlaylistForm from './PlaylistForm';
import PlaylistBuilder from './PlaylistBuilder';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/Modal';

export default function PlaylistList() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [buildingPlaylist, setBuildingPlaylist] = useState(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedPlaylists, setSelectedPlaylists] = useState(new Set());
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Fetch playlists
  const fetchPlaylists = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...filters
      };

      const response = await apiClient.getPlaylists(params);
      setPlaylists(response.playlists || []);
      setPagination(response.pagination || pagination);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
      setError('Failed to load playlists. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [filters]);

  // Handle create playlist
  const handleCreatePlaylist = async (playlistData) => {
    try {
      setActionLoading(true);
      const response = await apiClient.createPlaylist(playlistData);
      setPlaylists(prev => [response.playlist, ...prev]);
      setShowCreateModal(false);
      setError(null);
    } catch (err) {
      console.error('Failed to create playlist:', err);
      setError(err.message || 'Failed to create playlist');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle update playlist
  const handleUpdatePlaylist = async (playlistData) => {
    try {
      setActionLoading(true);
      const response = await apiClient.updatePlaylist(editingPlaylist.id, playlistData);
      setPlaylists(prev => prev.map(playlist => 
        playlist.id === editingPlaylist.id ? response.playlist : playlist
      ));
      setEditingPlaylist(null);
      setError(null);
    } catch (err) {
      console.error('Failed to update playlist:', err);
      setError(err.message || 'Failed to update playlist');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete playlist
  const handleDeletePlaylist = async (playlistId) => {
    try {
      setActionLoading(true);
      await apiClient.deletePlaylist(playlistId);
      setPlaylists(prev => prev.filter(playlist => playlist.id !== playlistId));
      setError(null);
    } catch (err) {
      console.error('Failed to delete playlist:', err);
      setError(err.message || 'Failed to delete playlist');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle duplicate playlist
  const handleDuplicatePlaylist = async (playlistId) => {
    try {
      setActionLoading(true);
      const response = await apiClient.request(`/api/playlists/${playlistId}/duplicate`, {
        method: 'POST'
      });
      setPlaylists(prev => [response.playlist, ...prev]);
      setError(null);
    } catch (err) {
      console.error('Failed to duplicate playlist:', err);
      setError(err.message || 'Failed to duplicate playlist');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      setActionLoading(true);
      const deletePromises = Array.from(selectedPlaylists).map(id => 
        apiClient.deletePlaylist(id)
      );
      await Promise.all(deletePromises);
      setPlaylists(prev => prev.filter(playlist => !selectedPlaylists.has(playlist.id)));
      setSelectedPlaylists(new Set());
      setShowBulkDeleteModal(false);
      setError(null);
    } catch (err) {
      console.error('Failed to delete playlists:', err);
      setError(err.message || 'Failed to delete playlists');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle selection
  const handleSelectPlaylist = (playlistId, selected) => {
    setSelectedPlaylists(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(playlistId);
      } else {
        newSet.delete(playlistId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedPlaylists(new Set(playlists.map(playlist => playlist.id)));
    } else {
      setSelectedPlaylists(new Set());
    }
  };

  // Calculate stats
  const stats = {
    total: pagination.total,
    totalItems: playlists.reduce((sum, playlist) => sum + playlist.totalItems, 0),
    totalDuration: playlists.reduce((sum, playlist) => sum + playlist.totalDuration, 0)
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading && playlists.length === 0) {
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
          <h1 className="text-2xl font-semibold text-gray-900">Playlists</h1>
          <div className="mt-2 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Badge variant="primary">Total</Badge>
              <span className="text-sm text-gray-600">{stats.total}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="success">Items</Badge>
              <span className="text-sm text-gray-600">{stats.totalItems}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="info">Duration</Badge>
              <span className="text-sm text-gray-600">{formatDuration(stats.totalDuration)}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          {selectedPlaylists.size > 0 && (
            <Button
              variant="danger"
              onClick={() => setShowBulkDeleteModal(true)}
              disabled={actionLoading}
            >
              Delete Selected ({selectedPlaylists.size})
            </Button>
          )}
          <Button onClick={() => setShowCreateModal(true)}>
            Create Playlist
          </Button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search playlists by name..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        
        <div className="flex gap-3">
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
          </select>
        </div>
      </div>

      {/* Bulk Selection Controls */}
      {playlists.length > 0 && (
        <div className="flex items-center space-x-4 text-sm">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedPlaylists.size === playlists.length && playlists.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">
              Select All ({selectedPlaylists.size} selected)
            </span>
          </label>
        </div>
      )}

      {/* Playlists Grid */}
      {playlists.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filters.search ? 'No playlists found' : 'No playlists'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search 
              ? 'Try adjusting your search criteria.'
              : 'Get started by creating your first playlist.'
            }
          </p>
          {!filters.search && (
            <div className="mt-6">
              <Button onClick={() => setShowCreateModal(true)}>
                Create Playlist
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onEdit={setEditingPlaylist}
              onDelete={handleDeletePlaylist}
              onDuplicate={handleDuplicatePlaylist}
              onBuild={setBuildingPlaylist}
              loading={actionLoading}
              selectable={true}
              selected={selectedPlaylists.has(playlist.id)}
              onSelect={handleSelectPlaylist}
            />
          ))}
        </div>
      )}

      {/* Create Playlist Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Playlist"
        size="md"
      >
        <PlaylistForm
          onSubmit={handleCreatePlaylist}
          onCancel={() => setShowCreateModal(false)}
          loading={actionLoading}
        />
      </Modal>

      {/* Edit Playlist Modal */}
      <Modal
        isOpen={!!editingPlaylist}
        onClose={() => setEditingPlaylist(null)}
        title="Edit Playlist"
        size="md"
      >
        {editingPlaylist && (
          <PlaylistForm
            playlist={editingPlaylist}
            onSubmit={handleUpdatePlaylist}
            onCancel={() => setEditingPlaylist(null)}
            loading={actionLoading}
          />
        )}
      </Modal>

      {/* Playlist Builder Modal */}
      <Modal
        isOpen={!!buildingPlaylist}
        onClose={() => setBuildingPlaylist(null)}
        title={`Build Playlist: ${buildingPlaylist?.name}`}
        size="xl"
      >
        {buildingPlaylist && (
          <PlaylistBuilder
            playlist={buildingPlaylist}
            onSave={(updatedPlaylist) => {
              setPlaylists(prev => prev.map(p => 
                p.id === updatedPlaylist.id ? updatedPlaylist : p
              ));
              setBuildingPlaylist(null);
            }}
            onCancel={() => setBuildingPlaylist(null)}
          />
        )}
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Playlists"
        message={`Are you sure you want to delete ${selectedPlaylists.size} playlist${selectedPlaylists.size > 1 ? 's' : ''}? This action cannot be undone and may affect screen assignments.`}
        confirmText={`Delete ${selectedPlaylists.size} Playlist${selectedPlaylists.size > 1 ? 's' : ''}`}
        type="danger"
      />
    </div>
  );
}