'use client';

import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-modal" 
        onClose={closeOnOverlayClick ? onClose : () => {}}
        {...props}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        {/* Modal container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={`
                w-full ${sizeClasses[size]} transform overflow-hidden rounded-lg 
                bg-white text-left align-middle shadow-xl transition-all ${className}
              `}>
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    {title && (
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        {title}
                      </Dialog.Title>
                    )}
                    
                    {showCloseButton && (
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className={title || showCloseButton ? '' : 'p-6'}>
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Modal Body Component
const ModalBody = ({ children, className = '', ...props }) => (
  <div className={`px-6 py-4 ${className}`} {...props}>
    {children}
  </div>
);

// Modal Footer Component
const ModalFooter = ({ 
  children, 
  className = '',
  primaryAction,
  secondaryAction,
  ...props 
}) => (
  <div className={`px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 ${className}`} {...props}>
    {children || (
      <>
        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
          >
            {secondaryAction.label || 'Cancel'}
          </Button>
        )}
        
        {primaryAction && (
          <Button
            variant={primaryAction.variant || 'primary'}
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            loading={primaryAction.loading}
          >
            {primaryAction.label || 'Confirm'}
          </Button>
        )}
      </>
    )}
  </div>
);

// Confirmation Modal
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
  ...props
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="sm"
    {...props}
  >
    <ModalBody>
      <p className="text-sm text-gray-600">{message}</p>
    </ModalBody>
    
    <ModalFooter
      primaryAction={{
        label: confirmLabel,
        onClick: onConfirm,
        variant,
        loading
      }}
      secondaryAction={{
        label: cancelLabel,
        onClick: onClose
      }}
    />
  </Modal>
);

Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
Modal.Confirm = ConfirmModal;

export { ConfirmModal };
export default Modal;