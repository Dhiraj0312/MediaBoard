'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Toast Context
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((message, options = {}) => {
    return addToast({ ...options, type: 'success', message });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast({ ...options, type: 'error', message, duration: 7000 });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({ ...options, type: 'warning', message });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast({ ...options, type: 'info', message });
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Individual Toast Component
const Toast = ({ toast, onRemove }) => {
  const getIcon = () => {
    const iconClass = "h-5 w-5";
    
    switch (toast.type) {
      case 'success':
        return <CheckCircleIcon className={`${iconClass} text-green-400`} />;
      case 'warning':
        return <ExclamationTriangleIcon className={`${iconClass} text-yellow-400`} />;
      case 'error':
        return <XCircleIcon className={`${iconClass} text-red-400`} />;
      case 'info':
      default:
        return <InformationCircleIcon className={`${iconClass} text-blue-400`} />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-800';
      case 'warning':
        return 'text-yellow-800';
      case 'error':
        return 'text-red-800';
      case 'info':
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div className={`
      max-w-sm w-full shadow-lg rounded-lg pointer-events-auto border
      ${getBackgroundColor()}
      transform transition-all duration-300 ease-in-out
      animate-slideIn
    `}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="ml-3 w-0 flex-1">
            {toast.title && (
              <p className={`text-sm font-medium ${getTextColor()}`}>
                {toast.title}
              </p>
            )}
            <p className={`text-sm ${toast.title ? 'mt-1' : 'font-medium'} ${getTextColor()}`}>
              {toast.message}
            </p>
            
            {toast.action && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={toast.action.onClick}
                  className={`text-sm font-medium underline hover:no-underline ${getTextColor()}`}
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0 flex">
            <button
              type="button"
              onClick={() => onRemove(toast.id)}
              className={`
                inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2
                ${toast.type === 'success' ? 'text-green-400 hover:text-green-500 focus:ring-green-500' :
                  toast.type === 'warning' ? 'text-yellow-400 hover:text-yellow-500 focus:ring-yellow-500' :
                  toast.type === 'error' ? 'text-red-400 hover:text-red-500 focus:ring-red-500' :
                  'text-blue-400 hover:text-blue-500 focus:ring-blue-500'}
              `}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast Container
const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-toast">
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </div>
  );
};

export default Toast;