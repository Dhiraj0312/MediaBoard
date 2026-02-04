'use client';

import { useState, useRef } from 'react';
import { apiClient } from '@/lib/api';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function MediaUpload({ onUploadComplete, onClose }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/ogg'
  ];

  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const validateFile = (file) => {
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, OGG) are allowed.';
    }
    if (file.size > maxFileSize) {
      return 'File too large. Maximum size is 50MB.';
    }
    return null;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    const validFiles = [];
    const errors = [];

    newFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        // Check for duplicates
        const isDuplicate = files.some(existingFile => 
          existingFile.name === file.name && existingFile.size === file.size
        );
        if (!isDuplicate) {
          validFiles.push({
            file,
            id: Math.random().toString(36).substring(2),
            name: file.name,
            size: file.size,
            type: file.type,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
          });
        }
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    } else {
      setError(null);
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (fileId) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // Clean up preview URLs
      const removedFile = prev.find(f => f.id === fileId);
      if (removedFile?.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      return updated;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      try {
        setUploadProgress(prev => ({
          ...prev,
          [fileData.id]: { status: 'uploading', progress: 0 }
        }));

        const formData = new FormData();
        formData.append('file', fileData.file);

        const response = await apiClient.uploadMedia(formData);
        
        setUploadProgress(prev => ({
          ...prev,
          [fileData.id]: { status: 'completed', progress: 100 }
        }));

        results.push(response.media);
      } catch (error) {
        console.error('Upload failed:', error);
        setUploadProgress(prev => ({
          ...prev,
          [fileData.id]: { status: 'error', progress: 0 }
        }));
        errors.push(`${fileData.name}: ${error.message}`);
      }
    }

    setUploading(false);

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (results.length > 0) {
      onUploadComplete(results);
      if (errors.length === 0) {
        // Clear files and close if all uploads successful
        setFiles([]);
        onClose?.();
      }
    }
  };

  const clearAll = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    setError(null);
    setUploadProgress({});
  };

  return (
    <div className="space-y-6">
      {/* Drag and Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {dragActive ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse files
            </p>
          </div>
          
          <div className="text-xs text-gray-400">
            <p>Supported formats: JPEG, PNG, GIF, WebP, MP4, WebM, OGG</p>
            <p>Maximum file size: 50MB</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <pre className="text-sm text-red-800 whitespace-pre-wrap">{error}</pre>
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Files to Upload ({files.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={uploading}
            >
              Clear All
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((fileData) => {
              const progress = uploadProgress[fileData.id];
              return (
                <div key={fileData.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {/* Preview */}
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded overflow-hidden">
                    {fileData.preview ? (
                      <img 
                        src={fileData.preview} 
                        alt={fileData.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileData.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(fileData.size)}
                    </p>
                    
                    {/* Progress */}
                    {progress && (
                      <div className="mt-1">
                        {progress.status === 'uploading' && (
                          <div className="flex items-center space-x-2">
                            <LoadingSpinner size="sm" />
                            <span className="text-xs text-blue-600">Uploading...</span>
                          </div>
                        )}
                        {progress.status === 'completed' && (
                          <span className="text-xs text-green-600">✓ Uploaded</span>
                        )}
                        {progress.status === 'error' && (
                          <span className="text-xs text-red-600">✗ Failed</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  {!uploading && (
                    <button
                      onClick={() => removeFile(fileData.id)}
                      className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={uploading}
        >
          Cancel
        </Button>
        <Button
          onClick={uploadFiles}
          disabled={files.length === 0 || uploading}
          loading={uploading}
        >
          Upload {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : 'Files'}
        </Button>
      </div>
    </div>
  );
}