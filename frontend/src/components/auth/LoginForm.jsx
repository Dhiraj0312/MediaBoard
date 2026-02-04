'use client';

import { useState, useRef, useEffect } from 'react';
import { useScreenReader } from '@/hooks/useAccessibility';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function LoginForm({ onSubmit, isLoading, error }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { announce } = useScreenReader();
  const emailRef = useRef(null);
  const errorRef = useRef(null);

  // Focus on email field when component mounts
  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, []);

  // Announce errors to screen readers
  useEffect(() => {
    if (error) {
      announce(`Login error: ${error}`, 'assertive');
    }
  }, [error, announce]);

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    
    // Announce validation errors
    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors).join('. ');
      announce(`Form validation errors: ${errorMessages}`, 'assertive');
    }
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Focus on first field with error
      const firstErrorField = Object.keys(validationErrors)[0];
      if (firstErrorField === 'email' && emailRef.current) {
        emailRef.current.focus();
      }
      return;
    }

    announce('Signing in...', 'polite');
    await onSubmit(formData.email, formData.password);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    announce(showPassword ? 'Password hidden' : 'Password visible', 'polite');
  };

  return (
    <div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
        <fieldset disabled={isLoading} className="space-y-4">
          <legend className="sr-only">Login credentials</legend>
          
          <Input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            label="Email address"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            error={validationErrors.email}
            placeholder="Enter your email address"
            leftIcon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            }
            aria-describedby={validationErrors.email ? 'email-error' : undefined}
          />

          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              error={validationErrors.password}
              placeholder="Enter your password"
              leftIcon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              rightIcon={
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              }
              aria-describedby={validationErrors.password ? 'password-error' : 'password-help'}
            />
            <div id="password-help" className="sr-only">
              Password must be at least 6 characters long
            </div>
          </div>
        </fieldset>

        {error && (
          <div 
            ref={errorRef}
            className="rounded-md bg-red-50 border border-red-200 p-4"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Login Failed
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <Button
          type="submit"
          loading={isLoading}
          fullWidth
          size="lg"
          className="relative"
          aria-describedby="login-button-help"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
        
        <div id="login-button-help" className="sr-only">
          Press Enter or click to sign in to your account
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact your system administrator
          </p>
        </div>
      </form>

      {/* Instructions for screen readers */}
      <div className="sr-only" aria-live="polite">
        <p>
          This is the login form for the Digital Signage Platform. 
          Enter your email address and password to access the admin portal.
        </p>
      </div>
    </div>
  );
}