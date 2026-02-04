'use client';

import { useSkipLinks } from '@/hooks/useAccessibility';

const SkipLinks = () => {
  const { skipToContent, skipToNavigation } = useSkipLinks();

  return (
    <div className="sr-only focus-within:not-sr-only">
      <div className="fixed top-0 left-0 z-[9999] bg-blue-600 text-white p-2 rounded-br-md">
        <button
          onClick={skipToContent}
          className="mr-4 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
        >
          Skip to main content
        </button>
        <button
          onClick={skipToNavigation}
          className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
        >
          Skip to navigation
        </button>
      </div>
    </div>
  );
};

export default SkipLinks;