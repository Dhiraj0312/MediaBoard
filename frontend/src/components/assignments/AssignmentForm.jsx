'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AssignmentForm({ 
  assignment = null, 
  onSubmit, 
  onCancel, 
  loading = false 
}) {
  const [formData, setFormData] = useState({
    screenId: assignment?.screen?.id || '',
    playlistId: assignment?.playlist?.id || ''
  });
  const [screens, setScreens] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // Load screens and playlists
  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true);
        
        const [screensResponse, playlistsResponse] = await Promise.all([
          apiClient.getScreens(),
          apiClient.getPlaylists()
        ]);
        
        setScreens(screensResponse.screens || []);
        setPlaylists(playlistsResponse.playlists || []);
      } catch (error) {
        console.error('Failed to load data:', error);
        setErrors({ general: 'Failed to load screens and playlists' });
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user makes a selection
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.screenId) {
      newErrors.screenId = 'Please select a screen';
    }

    if (!formData.playlistId) {
      newErrors.playlistId = 'Please select a playlist';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  const availableScreens = assignment 
    ? screens // When editing, show all screens including the currently assigned one
    : screens.filter(screen => 
        // When creating, only show screens without assignments
        !screen.assignedPlaylist
      );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{errors.general}</p>
        </div>
      )}

      {/* Screen Selection */}
      <div>
        <label htmlFor="screenId" className="block text-sm font-medium text-gray-700 mb-1">
          Screen *
        </label>
        <select
          id="screenId"
          name="screenId"
          value={formData.screenId}
          onChange={handleChange}
          disabled={loading || assignment} // Disable screen selection when editing
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.screenId 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300'
          } ${assignment ? 'bg-gray-100' : ''}`}
        >
          <option value="">Select a screen</option>
          {availableScreens.map((screen) => (
            <option key={screen.id} value={screen.id}>
              {screen.name} {screen.location ? `(${screen.location})` : ''} - {screen.status}
            </option>
          ))}
        </select>
        {errors.screenId && (
          <p className="mt-1 text-sm text-red-600">{errors.screenId}</p>
        )}
        {assignment && (
          <p className="mt-1 text-sm text-gray-500">
            Screen cannot be changed when editing an assignment
          </p>
        )}
      </div>

      {/* Playlist Selection */}
      <div>
        <label htmlFor="playlistId" className="block text-sm font-medium text-gray-700 mb-1">
          Playlist *
        </label>
        <select
          id="playlistId"
          name="playlistId"
          value={formData.playlistId}
          onChange={handleChange}
          disabled={loading}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.playlistId 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300'
          }`}
        >
          <option value="">Select a playlist</option>
          {playlists.map((playlist) => (
            <option key={playlist.id} value={playlist.id}>
              {playlist.name} ({playlist.totalItems} items, {playlist.totalDurationFormatted})
            </option>
          ))}
        </select>
        {errors.playlistId && (
          <p className="mt-1 text-sm text-red-600">{errors.playlistId}</p>
        )}
      </div>

      {/* Selected Screen Info */}
      {formData.screenId && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Screen</h4>
          {(() => {
            const selectedScreen = screens.find(s => s.id === formData.screenId);
            if (!selectedScreen) return null;
            
            return (
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Name:</span> 
                  <span className="ml-2">{selectedScreen.name}</span>
                </div>
                {selectedScreen.location && (
                  <div>
                    <span className="font-medium">Location:</span> 
                    <span className="ml-2">{selectedScreen.location}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium">Status:</span> 
                  <span className={`ml-2 capitalize ${
                    selectedScreen.status === 'online' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedScreen.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Device Code:</span> 
                  <code className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs font-mono">
                    {selectedScreen.device_code}
                  </code>
                </div>
                {selectedScreen.assignedPlaylist && !assignment && (
                  <div className="text-yellow-600">
                    <span className="font-medium">Warning:</span> 
                    <span className="ml-2">
                      This screen is currently assigned to &quot;{selectedScreen.assignedPlaylist.name}&quot;. 
                      Creating this assignment will replace the existing one.
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Selected Playlist Info */}
      {formData.playlistId && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Playlist</h4>
          {(() => {
            const selectedPlaylist = playlists.find(p => p.id === formData.playlistId);
            if (!selectedPlaylist) return null;
            
            return (
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Name:</span> 
                  <span className="ml-2">{selectedPlaylist.name}</span>
                </div>
                {selectedPlaylist.description && (
                  <div>
                    <span className="font-medium">Description:</span> 
                    <span className="ml-2">{selectedPlaylist.description}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium">Items:</span> 
                  <span className="ml-2">{selectedPlaylist.totalItems}</span>
                </div>
                <div>
                  <span className="font-medium">Duration:</span> 
                  <span className="ml-2">{selectedPlaylist.totalDurationFormatted}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
        >
          {assignment ? 'Update Assignment' : 'Create Assignment'}
        </Button>
      </div>
    </form>
  );
}