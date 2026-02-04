'use client';

import { useState } from 'react';
import { components } from '@/styles/theme';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Alert = ({ 
  children, 
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  className = '',
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  if (!isVisible) return null;
  
  const baseClasses = components.alert.base;
  const variantClasses = components.alert.variants[variant] || components.alert.variants.info;
  
  const alertClasses = `
    ${baseClasses}
    ${variantClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const getIcon = () => {
    const iconClass = "h-5 w-5";
    
    switch (variant) {
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

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div className={alertClasses} {...props}>
      <div className="flex">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          
          <div className={`text-sm ${title ? '' : 'font-medium'}`}>
            {children}
          </div>
        </div>
        
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={handleDismiss}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  variant === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' :
                  variant === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600' :
                  variant === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-600' :
                  'text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
                }`}
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;