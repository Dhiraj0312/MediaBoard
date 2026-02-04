'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';

export default function PlaylistBuilder({ playlist, onSave, onCancel }) {
  const [media, setMedia] = useState([]);
  const [playlistItems, setPlaylistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mediaFilter, setMediaFilter] = useState('all');
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Load media and playlist items
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load media
        const mediaResponse = await apiClient.getMedia({ limit: 100 });
        setMedia(mediaResponse.media || []);
        
        // Set initial playlist items
        setPlaylistItems(playlist.items.map(item => ({
          id: item.id,
          media_id: item.media.id,
          duration: item.duration,
          order_index: item.order_index,
          media: item.media
        })));
        
        setError(null);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load media. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [playlist]);

  // Filter media based on search and type
  const filteredMedia = media.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = mediaFilter === 'all' || item.type === mediaFilter;
    return matchesSearch && matchesType;
  });

  // Add media to playlist
  const addToPlaylist = (mediaItem) => {
    const newItem = {
      id: `temp-${Date.now()}`,
      media_id: mediaItem.id,
      duration: 10, // Default 10 seconds
      order_index: playlistItems.length,
      media: mediaItem
    };
    setPlaylistItems(prev => [...prev, newItem]);
  };

  // Remove item from playlist
  const removeFromPlaylist = (index) => {
    setPlaylistItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update item duration
  const updateItemDuration = (index, duration) => {
    const numDuration = parseInt(duration) || 1;
    setPlaylistItems(prev => prev.map((item, i) => 
      i === index ? { ...item, duration: Math.max(1, Math.min(3600, numDuration)) } : item
    ));
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...playlistItems];
    const draggedItemData = newItems[draggedItem];
    
    // Remove dragged item
    newItems.splice(draggedItem, 1);
    
    // Insert at new position
    const insertIndex = draggedItem < dropIndex ? dropIndex - 1 : dropIndex;
    newItems.splice(insertIndex, 0, draggedItemData);
    
    setPlaylistItems(newItems);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  // Move item up/down
  const moveItem = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= playlistItems.length) return;

    const newItems = [...playlistItems];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setPlaylistItems(newItems);
  };

  // Calculate total duration
  const totalDuration = playlistItems.reduce((sum, item) => sum + item.duration, 0);

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Save playlist
  const handleSave = async () => {
    try {
      setSaving(true);
      
      const items = playlistItems.map((item, index) => ({
        media_id: item.media_id,
        duration: item.duration,
        order_index: index
      }));

      const response = await apiClient.updatePlaylist(playlist.id, { items });
      onSave(response.playlist);
    } catch (err) {
      console.error('Failed to save playlist:', err);
      setError(err.message || 'Failed to save playlist');
    } finally {
      setSaving(false);
    }
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
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Media Library */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Media Library</h3>
            
            {/* Media Filters */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Search media..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={mediaFilter}
                onChange={(e) => setMediaFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
              </select>
            </div>
          </div>

          {/* Media Grid */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredMedia.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No media found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-2">
                {filteredMedia.map((mediaItem) => (
                  <div
                    key={mediaItem.id}
                    className="relative group cursor-pointer border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors"
                    onClick={() => addToPlaylist(mediaItem)}
                  >
                    <div className="aspect-video bg-gray-100">
                      {mediaItem.type === 'image' ? (
                        <img
                          src={mediaItem.url}
                          alt={mediaItem.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white hover:bg-opacity-20"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add
                      </Button>
                    </div>

                    <div className="absolute top-1 right-1">
                      <Badge variant={mediaItem.type === 'image' ? 'success' : 'info'} size="sm">
                        {mediaItem.type}
                      </Badge>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-1">
                      <p className="text-xs truncate">{mediaItem.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Playlist Builder */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Playlist Items ({playlistItems.length})
            </h3>
            <div className="text-sm text-gray-500">
              Total: {formatDuration(totalDuration)}
            </div>
          </div>

          {/* Playlist Items */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            {playlistItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <p>No items in playlist</p>
                <p className="text-xs mt-1">Add media from the library</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {playlistItems.map((item, index) => (
                  <div
                    key={`${item.media_id}-${index}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center space-x-3 p-3 bg-white border rounded-lg cursor-move hover:shadow-sm transition-shadow ${
                      dragOverIndex === index ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    } ${draggedItem === index ? 'opacity-50' : ''}`}
                  >
                    {/* Drag Handle */}
                    <div className="text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>

                    {/* Order Number */}
                    <div className="flex-shrink-0 w-6 text-sm text-gray-500 font-medium">
                      {index + 1}
                    </div>

                    {/* Media Preview */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded overflow-hidden">
                      {item.media.type === 'image' ? (
                        <img
                          src={item.media.url}
                          alt={item.media.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Media Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.media.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.media.type}
                      </p>
                    </div>

                    {/* Duration Input */}
                    <div className="flex-shrink-0">
                      <input
                        type="number"
                        min="1"
                        max="3600"
                        value={item.duration}
                        onChange={(e) => updateItemDuration(index, e.target.value)}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-xs text-gray-500 ml-1">s</span>
                    </div>

                    {/* Move Controls */}
                    <div className="flex-shrink-0 flex flex-col space-y-1">
                      <button
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === playlistItems.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromPlaylist(index)}
                      className="flex-shrink-0 p-1 text-red-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          loading={saving}
          disabled={saving}
        >
          Save Playlist
        </Button>
      </div>
    </div>
  );
}