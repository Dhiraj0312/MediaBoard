'use client';

import { forwardRef } from 'react';
import { components } from '@/styles/theme';

const Input = forwardRef(({
  label,
  error,
  success,
  helperText,
  required = false,
  className = '',
  containerClassName = '',
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  const baseClasses = components.input.base;
  const errorClasses = error ? components.input.error : '';
  const successClasses = success ? components.input.success : '';
  
  const inputClasses = `
    ${baseClasses}
    ${errorClasses}
    ${successClasses}
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon ? 'pr-10' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const inputId = props.id || props.name;

  return (
    <div className={containerClassName}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 sm:text-sm">
              {leftIcon}
            </span>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : 
            helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400 sm:text-sm">
              {rightIcon}
            </span>
          </div>
        )}
      </div>
      
      {(error || success || helperText) && (
        <div className="mt-1">
          {error && (
            <p id={`${inputId}-error`} className="text-sm text-red-600 flex items-center" role="alert">
              <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
          
          {success && !error && (
            <p className="text-sm text-green-600 flex items-center">
              <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </p>
          )}
          
          {helperText && !error && !success && (
            <p id={`${inputId}-helper`} className="text-sm text-gray-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;