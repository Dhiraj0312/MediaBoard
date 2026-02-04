'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function BulkAssignmentForm({ 
  onSubmit, 
  onCancel, 
  loading = false 
}) {
  const [screens, setScreens] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedScreens, setSelectedScreens] = useState(new Set());
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [assignmentMode, setAssignmentMode] = useState('single'); // 'single' or 'individual'
  const [individualAssignments, setIndividualAssignments] = useState({});
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

  const handleScreenSelection = (screenId, selected) => {
    setSelectedScreens(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(screenId);
      } else {
        newSet.delete(screenId);
        // Remove from individual assignments if deselected
        setIndividualAssignments(prev => {
          const newAssignments = { ...prev };
          delete newAssignments[screenId];
          return newAssignments;
        });
      }
      return newSet;
    });
  };

  const handleSelectAllScreens = (selected) => {
    if (selected) {
      const availableScreenIds = screens
        .filter(screen => !screen.assignedPlaylist)
        .map(screen => screen.id);
      setSelectedScreens(new Set(availableScreenIds));
    } else {
      setSelectedScreens(new Set());
      setIndividualAssignments({});
    }
  };

  const handleIndividualPlaylistChange = (screenId, playlistId) => {
    setIndividualAssignments(prev => ({
      ...prev,
      [screenId]: playlistId
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (selectedScreens.size === 0) {
      newErrors.screens = 'Please select at least one screen';
    }

    if (assignmentMode === 'single') {
      if (!selectedPlaylist) {
        newErrors.playlist = 'Please select a playlist';
      }
    } else {
      // Check individual assignments
      const missingAssignments = Array.from(selectedScreens).filter(
        screenId => !individualAssignments[screenId]
      );
      
      if (missingAssignments.length > 0) {
        newErrors.individual = `Please assign playlists to all selected screens`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    let assignments;
    
    if (assignmentMode === 'single') {
      // Assign same playlist to all selected screens
      assignments = Array.from(selectedScreens).map(screenId => ({
        screenId,
        playlistId: selectedPlaylist
      }));
    } else {
      // Individual assignments
      assignments = Array.from(selectedScreens).map(screenId => ({
        screenId,
        playlistId: individualAssignments[screenId]
      }));
    }

    onSubmit(assignments);
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  const availableScreens = screens.filter(screen => !screen.assignedPlaylist);
  const selectedScreensArray = Array.from(selectedScreens);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{errors.general}</p>
        </div>
      )}

      {/* Assignment Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Assignment Mode
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="assignmentMode"
              value="single"
              checked={assignmentMode === 'single'}
              onChange={(e) => setAssignmentMode(e.target.value)}
              className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Assign the same playlist to all selected screens
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="assignmentMode"
              value="individual"
              checked={assignmentMode === 'individual'}
              onChange={(e) => setAssignmentMode(e.target.value)}
              className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Assign different playlists to each screen
            </span>
          </label>
        </div>
      </div>

      {/* Screen Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Select Screens ({selectedScreens.size} selected)
          </label>
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={selectedScreens.size === availableScreens.length && availableScreens.length > 0}
              onChange={(e) => handleSelectAllScreens(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-gray-700">Select All Available</span>
          </label>
        </div>

        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
          {availableScreens.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No screens available for assignment</p>
              <p className="text-xs mt-1">All screens are already assigned to playlists</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {availableScreens.map((screen) => (
                <label
                  key={screen.id}
                  className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedScreens.has(screen.id)}
                    onChange={(e) => handleScreenSelection(screen.id, e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {screen.name}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        screen.status === 'online' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {screen.status}
                      </span>
                    </div>
                    {screen.location && (
                      <p className="text-xs text-gray-500">{screen.location}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        {errors.screens && (
          <p className="mt-1 text-sm text-red-600">{errors.screens}</p>
        )}
      </div>

      {/* Playlist Assignment */}
      {selectedScreens.size > 0 && (
        <div>
          {assignmentMode === 'single' ? (
            // Single playlist for all screens
            <div>
              <label htmlFor="playlist" className="block text-sm font-medium text-gray-700 mb-1">
                Playlist for All Selected Screens *
              </label>
              <select
                id="playlist"
                value={selectedPlaylist}
                onChange={(e) => setSelectedPlaylist(e.target.value)}
                disabled={loading}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.playlist 
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
              {errors.playlist && (
                <p className="mt-1 text-sm text-red-600">{errors.playlist}</p>
              )}
            </div>
          ) : (
            // Individual playlists for each screen
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Assign Playlists to Each Screen
              </label>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {selectedScreensArray.map((screenId) => {
                  const screen = screens.find(s => s.id === screenId);
                  if (!screen) return null;
                  
                  return (
                    <div key={screenId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {screen.name}
                        </p>
                        {screen.location && (
                          <p className="text-xs text-gray-500">{screen.location}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 w-48">
                        <select
                          value={individualAssignments[screenId] || ''}
                          onChange={(e) => handleIndividualPlaylistChange(screenId, e.target.value)}
                          disabled={loading}
                          className="block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select playlist</option>
                          {playlists.map((playlist) => (
                            <option key={playlist.id} value={playlist.id}>
                              {playlist.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
              {errors.individual && (
                <p className="mt-1 text-sm text-red-600">{errors.individual}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {selectedScreens.size > 0 && (
        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Assignment Summary</h4>
          <p className="text-sm text-blue-800">
            {assignmentMode === 'single' 
              ? `Assign "${playlists.find(p => p.id === selectedPlaylist)?.name || 'selected playlist'}" to ${selectedScreens.size} screen${selectedScreens.size > 1 ? 's' : ''}`
              : `Create ${selectedScreens.size} individual assignment${selectedScreens.size > 1 ? 's' : ''}`
            }
          </p>
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
          disabled={loading || selectedScreens.size === 0}
        >
          Create Assignments ({selectedScreens.size})
        </Button>
      </div>
    </form>
  );
}