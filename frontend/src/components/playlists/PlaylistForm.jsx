'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function PlaylistForm({ 
  playlist = null, 
  onSubmit, 
  onCancel, 
  loading = false 
}) {
  const [formData, setFormData] = useState({
    name: playlist?.name || '',
    description: playlist?.description || ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Playlist name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Playlist name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Playlist name must be less than 100 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Playlist Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        required
        placeholder="Enter playlist name (e.g., Morning Ads, Lobby Content)"
        disabled={loading}
      />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter playlist description (optional)"
          disabled={loading}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.description 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300'
          }`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Optional: Describe what this playlist is for
        </p>
      </div>

      {playlist && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Playlist Information</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Items:</span> 
              <span className="ml-2">{playlist.totalItems}</span>
            </div>
            <div>
              <span className="font-medium">Total Duration:</span> 
              <span className="ml-2">{playlist.totalDurationFormatted}</span>
            </div>
            <div>
              <span className="font-medium">Created:</span> 
              <span className="ml-2">
                {new Date(playlist.created_at).toLocaleDateString()}
              </span>
            </div>
            {playlist.updated_at !== playlist.created_at && (
              <div>
                <span className="font-medium">Last Modified:</span> 
                <span className="ml-2">
                  {new Date(playlist.updated_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
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
          {playlist ? 'Update Playlist' : 'Create Playlist'}
        </Button>
      </div>
    </form>
  );
}