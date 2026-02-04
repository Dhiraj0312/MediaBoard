'use client';

import { useEffect, useState, useCallback } from 'react';

// Hook for managing focus and keyboard navigation
export const useFocusManagement = () => {
  const [focusedElement, setFocusedElement] = useState(null);

  const trapFocus = useCallback((containerRef) => {
    if (!containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    containerRef.current.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      containerRef.current?.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const restoreFocus = useCallback((element) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }, []);

  return {
    focusedElement,
    setFocusedElement,
    trapFocus,
    restoreFocus,
  };
};

// Hook for keyboard navigation
export const useKeyboardNavigation = (onEscape, onEnter) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case 'Enter':
          if (onEnter && event.target.tagName !== 'BUTTON' && event.target.tagName !== 'A') {
            event.preventDefault();
            onEnter();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, onEnter]);
};

// Hook for screen reader announcements
export const useScreenReader = () => {
  const [announcements, setAnnouncements] = useState([]);

  const announce = useCallback((message, priority = 'polite') => {
    const id = Date.now();
    const announcement = { id, message, priority };
    
    setAnnouncements(prev => [...prev, announcement]);

    // Remove announcement after it's been read
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 1000);
  }, []);

  const LiveRegion = ({ className = '' }) => (
    <div className={`sr-only ${className}`}>
      {announcements.map(({ id, message, priority }) => (
        <div key={id} aria-live={priority} aria-atomic="true">
          {message}
        </div>
      ))}
    </div>
  );

  return { announce, LiveRegion };
};

// Hook for reduced motion preferences
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Hook for high contrast mode detection
export const useHighContrast = () => {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (e) => setPrefersHighContrast(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast;
};

// Hook for managing ARIA attributes
export const useAriaAttributes = (initialAttributes = {}) => {
  const [attributes, setAttributes] = useState(initialAttributes);

  const updateAttribute = useCallback((key, value) => {
    setAttributes(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const removeAttribute = useCallback((key) => {
    setAttributes(prev => {
      const newAttributes = { ...prev };
      delete newAttributes[key];
      return newAttributes;
    });
  }, []);

  return {
    attributes,
    updateAttribute,
    removeAttribute,
    setAttributes,
  };
};

// Hook for skip links
export const useSkipLinks = () => {
  const skipToContent = useCallback(() => {
    const mainContent = document.getElementById('main-content') || 
                       document.querySelector('main') ||
                       document.querySelector('[role="main"]');
    
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const skipToNavigation = useCallback(() => {
    const navigation = document.getElementById('main-navigation') ||
                      document.querySelector('nav') ||
                      document.querySelector('[role="navigation"]');
    
    if (navigation) {
      navigation.focus();
      navigation.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return {
    skipToContent,
    skipToNavigation,
  };
};

// Comprehensive accessibility hook
export const useAccessibility = () => {
  const focusManagement = useFocusManagement();
  const screenReader = useScreenReader();
  const prefersReducedMotion = useReducedMotion();
  const prefersHighContrast = useHighContrast();
  const ariaAttributes = useAriaAttributes();
  const skipLinks = useSkipLinks();

  return {
    ...focusManagement,
    ...screenReader,
    ...ariaAttributes,
    ...skipLinks,
    prefersReducedMotion,
    prefersHighContrast,
  };
};