'use client';

import { forwardRef } from 'react';
import { components } from '@/styles/theme';

const Card = forwardRef(({
  children,
  variant = 'base',
  className = '',
  hover = false,
  loading = false,
  ...props
}, ref) => {
  const baseClasses = components.card.base;
  const variantClasses = components.card[variant] || components.card.base;
  
  const cardClasses = `
    ${variantClasses}
    ${hover ? 'hover-glow cursor-pointer' : ''}
    ${loading ? 'opacity-50 pointer-events-none' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div ref={ref} className={cardClasses} {...props}>
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
      {children}
    </div>
  );
});

Card.displayName = 'Card';

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`} {...props}>
    {children}
  </div>
);

const CardBody = ({ children, className = '', padding = 'default', ...props }) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };
  
  return (
    <div className={`${paddingClasses[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-medium text-gray-900 ${className}`} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-gray-500 mt-1 ${className}`} {...props}>
    {children}
  </p>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Title = CardTitle;
Card.Description = CardDescription;

export default Card;