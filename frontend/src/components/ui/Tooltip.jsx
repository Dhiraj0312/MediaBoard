'use client';

import { useState, useRef, useEffect } from 'react';

const Tooltip = ({ 
  children, 
  content, 
  position = 'top',
  delay = 300,
  className = '',
  disabled = false,
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  const showTooltip = () => {
    if (disabled || !content) return;
    
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const getPositionClasses = () => {
    const baseClasses = 'absolute z-tooltip px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg whitespace-nowrap';
    
    switch (position) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`;
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2`;
      default:
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
    }
  };

  const getArrowClasses = () => {
    const baseArrow = 'absolute w-2 h-2 bg-gray-900 transform rotate-45';
    
    switch (position) {
      case 'top':
        return `${baseArrow} top-full left-1/2 -translate-x-1/2 -mt-1`;
      case 'bottom':
        return `${baseArrow} bottom-full left-1/2 -translate-x-1/2 -mb-1`;
      case 'left':
        return `${baseArrow} left-full top-1/2 -translate-y-1/2 -ml-1`;
      case 'right':
        return `${baseArrow} right-full top-1/2 -translate-y-1/2 -mr-1`;
      default:
        return `${baseArrow} top-full left-1/2 -translate-x-1/2 -mt-1`;
    }
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      ref={triggerRef}
      {...props}
    >
      {children}
      
      {isVisible && content && (
        <div
          ref={tooltipRef}
          className={`${getPositionClasses()} animate-fadeIn`}
          role="tooltip"
          aria-hidden="false"
        >
          {content}
          <div className={getArrowClasses()} aria-hidden="true" />
        </div>
      )}
    </div>
  );
};

export default Tooltip;