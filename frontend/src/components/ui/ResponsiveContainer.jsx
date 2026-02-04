'use client';

import { layout } from '@/styles/theme';

const ResponsiveContainer = ({ 
  children, 
  maxWidth = '7xl',
  padding = 'responsive',
  className = '',
  ...props 
}) => {
  const maxWidthClasses = {
    none: '',
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

  const paddingClasses = {
    none: '',
    sm: 'px-4',
    md: 'px-6',
    lg: 'px-8',
    responsive: 'px-4 sm:px-6 lg:px-8',
  };

  const containerClasses = `
    mx-auto
    ${maxWidthClasses[maxWidth] || maxWidthClasses['7xl']}
    ${paddingClasses[padding] || paddingClasses.responsive}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={containerClasses} {...props}>
      {children}
    </div>
  );
};

// Grid Container for responsive layouts
const ResponsiveGrid = ({ 
  children, 
  columns = { sm: 1, md: 2, lg: 3 },
  gap = 6,
  className = '',
  ...props 
}) => {
  const getGridClasses = () => {
    const gapClass = `gap-${gap}`;
    
    if (typeof columns === 'number') {
      return `grid ${gapClass} grid-cols-${columns}`;
    }
    
    const colClasses = [];
    if (columns.sm) colClasses.push(`grid-cols-${columns.sm}`);
    if (columns.md) colClasses.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) colClasses.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl) colClasses.push(`xl:grid-cols-${columns.xl}`);
    if (columns['2xl']) colClasses.push(`2xl:grid-cols-${columns['2xl']}`);
    
    return `grid ${gapClass} ${colClasses.join(' ')}`;
  };

  const gridClasses = `
    ${getGridClasses()}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={gridClasses} {...props}>
      {children}
    </div>
  );
};

// Flex Container for responsive layouts
const ResponsiveFlex = ({ 
  children, 
  direction = 'row',
  wrap = true,
  justify = 'start',
  align = 'start',
  gap = 4,
  className = '',
  ...props 
}) => {
  const directionClasses = {
    row: 'flex-row',
    'row-reverse': 'flex-row-reverse',
    col: 'flex-col',
    'col-reverse': 'flex-col-reverse',
  };

  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const alignClasses = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    baseline: 'items-baseline',
    stretch: 'items-stretch',
  };

  const flexClasses = `
    flex
    ${directionClasses[direction] || directionClasses.row}
    ${wrap ? 'flex-wrap' : 'flex-nowrap'}
    ${justifyClasses[justify] || justifyClasses.start}
    ${alignClasses[align] || alignClasses.start}
    gap-${gap}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={flexClasses} {...props}>
      {children}
    </div>
  );
};

// Responsive Stack (vertical layout with spacing)
const ResponsiveStack = ({ 
  children, 
  spacing = 4,
  className = '',
  ...props 
}) => {
  const stackClasses = `
    space-y-${spacing}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={stackClasses} {...props}>
      {children}
    </div>
  );
};

// Responsive Section with proper spacing
const ResponsiveSection = ({ 
  children, 
  spacing = 'normal',
  className = '',
  ...props 
}) => {
  const spacingClasses = {
    tight: 'py-8',
    normal: 'py-12',
    loose: 'py-16',
    xl: 'py-20',
  };

  const sectionClasses = `
    ${spacingClasses[spacing] || spacingClasses.normal}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <section className={sectionClasses} {...props}>
      {children}
    </section>
  );
};

// Responsive breakpoint utilities
export const useBreakpoint = () => {
  if (typeof window === 'undefined') return 'lg'; // SSR fallback
  
  const width = window.innerWidth;
  
  if (width < 640) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  if (width < 1280) return 'xl';
  return '2xl';
};

// Hide/Show components based on breakpoints
const ResponsiveShow = ({ 
  children, 
  above, 
  below, 
  only,
  className = '',
  ...props 
}) => {
  let classes = '';
  
  if (above) {
    classes += `hidden ${above}:block `;
  }
  
  if (below) {
    const breakpoints = ['sm', 'md', 'lg', 'xl', '2xl'];
    const index = breakpoints.indexOf(below);
    if (index > 0) {
      classes += `${breakpoints[index - 1]}:hidden `;
    }
  }
  
  if (only) {
    if (Array.isArray(only)) {
      classes += `hidden ${only.map(bp => `${bp}:block`).join(' ')} `;
    } else {
      classes += `hidden ${only}:block `;
    }
  }

  const showClasses = `
    ${classes}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={showClasses} {...props}>
      {children}
    </div>
  );
};

ResponsiveContainer.Grid = ResponsiveGrid;
ResponsiveContainer.Flex = ResponsiveFlex;
ResponsiveContainer.Stack = ResponsiveStack;
ResponsiveContainer.Section = ResponsiveSection;
ResponsiveContainer.Show = ResponsiveShow;

export default ResponsiveContainer;