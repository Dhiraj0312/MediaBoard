'use client';

import { forwardRef } from 'react';
import { components } from '@/styles/theme';
import LoadingSpinner from './LoadingSpinner';

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  leftIcon,
  rightIcon,
  fullWidth = false,
  ...props
}, ref) => {
  const baseClasses = components.button.base;
  const variantClasses = components.button.variants[variant] || components.button.variants.primary;
  const sizeClasses = components.button.sizes[size] || components.button.sizes.md;
  
  const isDisabled = disabled || loading;
  
  const buttonClasses = `
    ${baseClasses}
    ${variantClasses}
    ${sizeClasses}
    ${fullWidth ? 'w-full' : ''}
    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover-lift'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={buttonClasses}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" className="-ml-1 mr-2" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && (
            <span className="mr-2 flex-shrink-0">
              {leftIcon}
            </span>
          )}
          <span className="flex-1">{children}</span>
          {rightIcon && (
            <span className="ml-2 flex-shrink-0">
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;