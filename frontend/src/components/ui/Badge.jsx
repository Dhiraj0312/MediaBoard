'use client';

import { components } from '@/styles/theme';

const Badge = ({ 
  children, 
  variant = 'primary',
  className = '',
  ...props 
}) => {
  const baseClasses = components.badge.base;
  const variantClasses = components.badge.variants[variant] || components.badge.variants.primary;
  
  const badgeClasses = `
    ${baseClasses}
    ${variantClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <span className={badgeClasses} {...props}>
      {children}
    </span>
  );
};

// Status Badge component for screen status
const StatusBadge = ({ status, className = '', ...props }) => {
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'online':
      case 'active':
      case 'connected':
        return 'success';
      case 'offline':
      case 'inactive':
      case 'disconnected':
        return 'error';
      case 'warning':
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getStatusVariant(status)} className={className} {...props}>
      {status}
    </Badge>
  );
};

Badge.Status = StatusBadge;

export { StatusBadge };
export default Badge;