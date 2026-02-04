'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ScreenForm({ 
  screen = null, 
  onSubmit, 
  onCancel, 
  loading = false 
}) {
  const [formData, setFormData] = useState({
    name: screen?.name || '',
    location: screen?.location || ''
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
      newErrors.name = 'Screen name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Screen name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Screen name must be less than 100 characters';
    }

    if (formData.location && formData.location.length > 200) {
      newErrors.location = 'Location must be less than 200 characters';
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
      location: formData.location.trim() || null
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Screen Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        required
        placeholder="Enter screen name (e.g., Lobby Display, Conference Room A)"
        disabled={loading}
      />

      <Input
        label="Location"
        name="location"
        value={formData.location}
        onChange={handleChange}
        error={errors.location}
        placeholder="Enter location (optional)"
        helperText="Optional: Specify where this screen is located"
        disabled={loading}
      />

      {screen && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Device Information</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Device Code:</span> 
              <code className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs font-mono">
                {screen.device_code}
              </code>
            </div>
            <div>
              <span className="font-medium">Status:</span> 
              <span className={`ml-2 capitalize ${
                screen.status === 'online' ? 'text-green-600' : 'text-red-600'
              }`}>
                {screen.status}
              </span>
            </div>
            {screen.last_heartbeat && (
              <div>
                <span className="font-medium">Last Seen:</span> 
                <span className="ml-2">
                  {new Date(screen.last_heartbeat).toLocaleString()}
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
          {screen ? 'Update Screen' : 'Create Screen'}
        </Button>
      </div>
    </form>
  );
}