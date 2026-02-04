'use client';

import LoadingSpinner from './LoadingSpinner';

const LoadingState = ({ 
  message = 'Loading...',
  size = 'md',
  className = '',
  fullScreen = false,
  overlay = false,
  ...props 
}) => {
  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50'
    : overlay
    ? 'absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg'
    : 'flex items-center justify-center p-8';

  return (
    <div className={`${containerClasses} ${className}`} {...props}>
      <div className="text-center">
        <LoadingSpinner size={size} className="mx-auto mb-4" />
        <p className="text-sm text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
};

// Skeleton loading components with better responsive design
const SkeletonLine = ({ className = '', width = 'full' }) => {
  const widthClasses = {
    full: 'w-full',
    '3/4': 'w-3/4',
    '1/2': 'w-1/2',
    '1/3': 'w-1/3',
    '1/4': 'w-1/4',
  };

  return (
    <div className={`h-4 bg-gray-200 rounded loading-skeleton ${widthClasses[width]} ${className}`} />
  );
};

const SkeletonCard = ({ lines = 3, className = '', showHeader = true }) => (
  <div className={`card-enterprise ${className}`}>
    <div className="p-6">
      {showHeader && (
        <div className="h-6 bg-gray-200 rounded loading-skeleton w-1/3 mb-4" />
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine 
            key={i} 
            width={i === lines - 1 ? '3/4' : 'full'} 
          />
        ))}
      </div>
    </div>
  </div>
);

const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`card-enterprise overflow-hidden ${className}`}>
    {/* Header */}
    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded loading-skeleton w-3/4" />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="px-6 py-4 border-b border-gray-200 last:border-b-0">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-4 bg-gray-200 rounded loading-skeleton" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const SkeletonGrid = ({ items = 6, columns = 3, className = '' }) => (
  <div className={`grid-responsive ${
    columns === 2 ? 'md:grid-cols-2' :
    columns === 3 ? 'md:grid-cols-2 lg:grid-cols-3' :
    columns === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
    'md:grid-cols-2 lg:grid-cols-3'
  } ${className}`}>
    {Array.from({ length: items }).map((_, i) => (
      <SkeletonCard key={i} lines={2} />
    ))}
  </div>
);

const SkeletonStats = ({ count = 4, className = '' }) => (
  <div className={`grid-responsive md:grid-cols-2 lg:grid-cols-${count} ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card-enterprise">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-gray-200 rounded loading-skeleton"></div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <div className="h-4 bg-gray-200 rounded loading-skeleton w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded loading-skeleton w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const SkeletonDashboard = ({ className = '' }) => (
  <div className={`space-y-8 ${className}`}>
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="h-8 bg-gray-200 rounded loading-skeleton w-48"></div>
      <div className="flex space-x-2">
        <div className="h-8 w-20 bg-gray-200 rounded loading-skeleton"></div>
        <div className="h-8 w-24 bg-gray-200 rounded loading-skeleton"></div>
      </div>
    </div>
    
    {/* Stats Cards */}
    <SkeletonStats count={4} />
    
    {/* Main Content Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <SkeletonCard lines={8} />
      </div>
      <div>
        <SkeletonCard lines={5} />
      </div>
    </div>
  </div>
);

// Loading overlay for existing content
const LoadingOverlay = ({ children, loading, message = 'Loading...' }) => (
  <div className="relative">
    {children}
    {loading && (
      <LoadingState 
        overlay 
        message={message}
        className="animate-fadeIn"
      />
    )}
  </div>
);

LoadingState.Skeleton = {
  Line: SkeletonLine,
  Card: SkeletonCard,
  Table: SkeletonTable,
  Grid: SkeletonGrid,
  Stats: SkeletonStats,
  Dashboard: SkeletonDashboard,
};

LoadingState.Overlay = LoadingOverlay;

export default LoadingState;