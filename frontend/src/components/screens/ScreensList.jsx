'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import ScreenCard from './ScreenCard';
import ScreenForm from './ScreenForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { StatusBadge } from '@/components/ui/Badge';

export default function ScreensList() {
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingScreen, setEditingScreen] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all'
  });

  // Fetch screens
  const fetchScreens = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getScreens();
      setScreens(response.screens || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch screens:', err);
      setError('Failed to load screens. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreens();
  }, []);

  // Auto-refresh every 5 minutes - VERY CONSERVATIVE for production
  useEffect(() => {
    const interval = setInterval(fetchScreens, 300000);
    return () => clearInterval(interval);
  }, []);

  // Create screen
  const handleCreateScreen = async (screenData) => {
    try {
      setActionLoading(true);
      const response = await apiClient.createScreen(screenData);
      setScreens(prev => [response.screen, ...prev]);
      setShowCreateModal(false);
      setError(null);
    } catch (err) {
      console.error('Failed to create screen:', err);
      setError(err.message || 'Failed to create screen');
    } finally {
      setActionLoading(false);
    }
  };

  // Update screen
  const handleUpdateScreen = async (screenData) => {
    try {
      setActionLoading(true);
      const response = await apiClient.updateScreen(editingScreen.id, screenData);
      setScreens(prev => prev.map(screen => 
        screen.id === editingScreen.id ? response.screen : screen
      ));
      setEditingScreen(null);
      setError(null);
    } catch (err) {
      console.error('Failed to update screen:', err);
      setError(err.message || 'Failed to update screen');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete screen
  const handleDeleteScreen = async (screenId) => {
    try {
      setActionLoading(true);
      await apiClient.deleteScreen(screenId);
      setScreens(prev => prev.filter(screen => screen.id !== screenId));
      setError(null);
    } catch (err) {
      console.error('Failed to delete screen:', err);
      setError(err.message || 'Failed to delete screen');
    } finally {
      setActionLoading(false);
    }
  };

  // Regenerate device code
  const handleRegenerateCode = async (screenId) => {
    try {
      setActionLoading(true);
      const response = await apiClient.request(`/api/screens/${screenId}/regenerate-code`, {
        method: 'POST'
      });
      setScreens(prev => prev.map(screen => 
        screen.id === screenId ? response.screen : screen
      ));
      setError(null);
    } catch (err) {
      console.error('Failed to regenerate device code:', err);
      setError(err.message || 'Failed to regenerate device code');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter screens
  const filteredScreens = screens.filter(screen => {
    const matchesSearch = screen.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         (screen.location && screen.location.toLowerCase().includes(filters.search.toLowerCase()));
    const matchesStatus = filters.status === 'all' || screen.status === filters.status;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: screens.length,
    online: screens.filter(s => s.status === 'online').length,
    offline: screens.filter(s => s.status === 'offline').length
  };

  if (loading) {
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
          <h1 className="text-2xl font-semibold text-gray-900">Screens</h1>
          <div className="mt-2 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <StatusBadge status="online" />
              <span className="text-sm text-gray-600">{stats.online}</span>
            </div>
            <div className="flex items-center space-x-2">
              <StatusBadge status="offline" />
              <span className="text-sm text-gray-600">{stats.offline}</span>
            </div>
            <span className="text-sm text-gray-500">
              Total: {stats.total}
            </span>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={() => setShowCreateModal(true)}>
            Add Screen
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search screens by name or location..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <div className="sm:w-48">
          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Screens Grid */}
      {filteredScreens.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filters.search || filters.status !== 'all' ? 'No screens found' : 'No screens'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search || filters.status !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first digital signage screen.'
            }
          </p>
          {(!filters.search && filters.status === 'all') && (
            <div className="mt-6">
              <Button onClick={() => setShowCreateModal(true)}>
                Add Screen
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScreens.map((screen) => (
            <ScreenCard
              key={screen.id}
              screen={screen}
              onEdit={setEditingScreen}
              onDelete={handleDeleteScreen}
              onRegenerateCode={handleRegenerateCode}
              loading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Create Screen Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Screen"
        size="md"
      >
        <ScreenForm
          onSubmit={handleCreateScreen}
          onCancel={() => setShowCreateModal(false)}
          loading={actionLoading}
        />
      </Modal>

      {/* Edit Screen Modal */}
      <Modal
        isOpen={!!editingScreen}
        onClose={() => setEditingScreen(null)}
        title="Edit Screen"
        size="md"
      >
        {editingScreen && (
          <ScreenForm
            screen={editingScreen}
            onSubmit={handleUpdateScreen}
            onCancel={() => setEditingScreen(null)}
            loading={actionLoading}
          />
        )}
      </Modal>
    </div>
  );
}