'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import AssignmentCard from './AssignmentCard';
import AssignmentForm from './AssignmentForm';
import BulkAssignmentForm from './BulkAssignmentForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/Modal';

export default function AssignmentList() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [selectedAssignments, setSelectedAssignments] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'assigned_at',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Fetch assignments
  const fetchAssignments = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...filters,
        status: filters.status === 'all' ? undefined : filters.status
      };

      const response = await apiClient.getAssignments(params);
      setAssignments(response.assignments || []);
      setPagination(response.pagination || pagination);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
      setError('Failed to load assignments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [filters]);

  // Auto-refresh every 5 minutes - VERY CONSERVATIVE for production
  useEffect(() => {
    const interval = setInterval(fetchAssignments, 300000);
    return () => clearInterval(interval);
  }, []);

  // Handle create assignment
  const handleCreateAssignment = async (assignmentData) => {
    try {
      setActionLoading(true);
      const response = await apiClient.assignPlaylist(assignmentData.screenId, assignmentData.playlistId);
      setAssignments(prev => [response.assignment, ...prev]);
      setShowCreateModal(false);
      setError(null);
    } catch (err) {
      console.error('Failed to create assignment:', err);
      setError(err.message || 'Failed to create assignment');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle bulk assignment
  const handleBulkAssignment = async (bulkData) => {
    try {
      setActionLoading(true);
      const response = await apiClient.request('/api/assignments/bulk', {
        method: 'POST',
        body: JSON.stringify({ assignments: bulkData })
      });
      
      // Add successful assignments to the list
      if (response.successful) {
        const newAssignments = response.successful.map(item => item.assignment);
        setAssignments(prev => [...newAssignments, ...prev]);
      }
      
      setShowBulkModal(false);
      setError(null);
    } catch (err) {
      console.error('Failed to create bulk assignments:', err);
      setError(err.message || 'Failed to create assignments');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle update assignment
  const handleUpdateAssignment = async (assignmentData) => {
    try {
      setActionLoading(true);
      const response = await apiClient.request(`/api/assignments/${editingAssignment.id}`, {
        method: 'PUT',
        body: JSON.stringify(assignmentData)
      });
      setAssignments(prev => prev.map(assignment => 
        assignment.id === editingAssignment.id ? response.assignment : assignment
      ));
      setEditingAssignment(null);
      setError(null);
    } catch (err) {
      console.error('Failed to update assignment:', err);
      setError(err.message || 'Failed to update assignment');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete assignment
  const handleDeleteAssignment = async (assignmentId) => {
    try {
      setActionLoading(true);
      await apiClient.request(`/api/assignments/${assignmentId}`, {
        method: 'DELETE'
      });
      setAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId));
      setError(null);
    } catch (err) {
      console.error('Failed to delete assignment:', err);
      setError(err.message || 'Failed to delete assignment');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      setActionLoading(true);
      const deletePromises = Array.from(selectedAssignments).map(id => 
        apiClient.request(`/api/assignments/${id}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);
      setAssignments(prev => prev.filter(assignment => !selectedAssignments.has(assignment.id)));
      setSelectedAssignments(new Set());
      setShowBulkDeleteModal(false);
      setError(null);
    } catch (err) {
      console.error('Failed to delete assignments:', err);
      setError(err.message || 'Failed to delete assignments');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle selection
  const handleSelectAssignment = (assignmentId, selected) => {
    setSelectedAssignments(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(assignmentId);
      } else {
        newSet.delete(assignmentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedAssignments(new Set(assignments.map(assignment => assignment.id)));
    } else {
      setSelectedAssignments(new Set());
    }
  };

  // Filter assignments based on search
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.screen.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      assignment.playlist.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (assignment.screen.location && assignment.screen.location.toLowerCase().includes(filters.search.toLowerCase()));
    
    const matchesStatus = filters.status === 'all' || 
      (filters.status === 'online' && assignment.isScreenOnline) ||
      (filters.status === 'offline' && !assignment.isScreenOnline);
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: assignments.length,
    online: assignments.filter(a => a.isScreenOnline).length,
    offline: assignments.filter(a => !a.isScreenOnline).length
  };

  if (loading && assignments.length === 0) {
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
          <h1 className="text-2xl font-semibold text-gray-900">Screen Assignments</h1>
          <div className="mt-2 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Badge variant="success">Online</Badge>
              <span className="text-sm text-gray-600">{stats.online}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="danger">Offline</Badge>
              <span className="text-sm text-gray-600">{stats.offline}</span>
            </div>
            <span className="text-sm text-gray-500">
              Total: {stats.total}
            </span>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          {selectedAssignments.size > 0 && (
            <Button
              variant="danger"
              onClick={() => setShowBulkDeleteModal(true)}
              disabled={actionLoading}
            >
              Remove Selected ({selectedAssignments.size})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setShowBulkModal(true)}
          >
            Bulk Assign
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Assignment
          </Button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by screen name, playlist, or location..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        
        <div className="flex gap-3">
          <select
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setFilters(prev => ({ ...prev, sortBy, sortOrder }));
            }}
          >
            <option value="assigned_at-desc">Recently Assigned</option>
            <option value="assigned_at-asc">Oldest First</option>
            <option value="screens.name-asc">Screen Name A-Z</option>
            <option value="screens.name-desc">Screen Name Z-A</option>
            <option value="playlists.name-asc">Playlist A-Z</option>
            <option value="playlists.name-desc">Playlist Z-A</option>
          </select>
        </div>
      </div>

      {/* Bulk Selection Controls */}
      {assignments.length > 0 && (
        <div className="flex items-center space-x-4 text-sm">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedAssignments.size === assignments.length && assignments.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">
              Select All ({selectedAssignments.size} selected)
            </span>
          </label>
        </div>
      )}

      {/* Assignments Grid */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filters.search || filters.status !== 'all' ? 'No assignments found' : 'No assignments'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search || filters.status !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by assigning playlists to screens.'
            }
          </p>
          {(!filters.search && filters.status === 'all') && (
            <div className="mt-6">
              <Button onClick={() => setShowCreateModal(true)}>
                Create Assignment
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onEdit={setEditingAssignment}
              onDelete={handleDeleteAssignment}
              loading={actionLoading}
              selectable={true}
              selected={selectedAssignments.has(assignment.id)}
              onSelect={handleSelectAssignment}
            />
          ))}
        </div>
      )}

      {/* Create Assignment Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Assignment"
        size="md"
      >
        <AssignmentForm
          onSubmit={handleCreateAssignment}
          onCancel={() => setShowCreateModal(false)}
          loading={actionLoading}
        />
      </Modal>

      {/* Bulk Assignment Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Assignment"
        size="lg"
      >
        <BulkAssignmentForm
          onSubmit={handleBulkAssignment}
          onCancel={() => setShowBulkModal(false)}
          loading={actionLoading}
        />
      </Modal>

      {/* Edit Assignment Modal */}
      <Modal
        isOpen={!!editingAssignment}
        onClose={() => setEditingAssignment(null)}
        title="Edit Assignment"
        size="md"
      >
        {editingAssignment && (
          <AssignmentForm
            assignment={editingAssignment}
            onSubmit={handleUpdateAssignment}
            onCancel={() => setEditingAssignment(null)}
            loading={actionLoading}
          />
        )}
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        title="Remove Selected Assignments"
        message={`Are you sure you want to remove ${selectedAssignments.size} assignment${selectedAssignments.size > 1 ? 's' : ''}? This will stop content playback on the affected screens.`}
        confirmText={`Remove ${selectedAssignments.size} Assignment${selectedAssignments.size > 1 ? 's' : ''}`}
        type="danger"
      />
    </div>
  );
}