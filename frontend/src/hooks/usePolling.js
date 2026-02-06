/**
 * React hooks for polling integration
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { pollingManager } from '@/lib/polling';

/**
 * Generic polling hook
 */
export function usePolling(id, config, dependencies = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollerRef = useRef(null);

  const handleData = useCallback((newData, meta) => {
    setData(newData);
    setError(null);
    setIsLoading(false);
    setLastUpdated(new Date());
    
    if (config.onData) {
      config.onData(newData, meta);
    }
  }, [config.onData]);

  const handleError = useCallback((err, meta) => {
    setError(err);
    setIsLoading(false);
    
    if (config.onError) {
      config.onError(err, meta);
    }
  }, [config.onError]);

  const handleChange = useCallback((newData, oldData, meta) => {
    if (config.onChange) {
      config.onChange(newData, oldData, meta);
    }
  }, [config.onChange]);

  useEffect(() => {
    if (!config.fetchFunction) return;
    
    // Don't start polling if explicitly disabled
    if (config.enabled === false) {
      console.log(`[usePolling] Polling disabled for ${id}`);
      return;
    }

    // Create poller with enhanced config
    const pollerConfig = {
      ...config,
      onData: handleData,
      onError: handleError,
      onChange: handleChange
    };

    pollerRef.current = pollingManager.createPoller(id, pollerConfig);
    pollerRef.current.start();

    return () => {
      if (pollerRef.current) {
        pollingManager.stopPoller(id);
        pollerRef.current = null;
      }
    };
  }, [id, handleData, handleError, handleChange, config.enabled, ...dependencies]);

  const refresh = useCallback(() => {
    if (pollerRef.current) {
      pollerRef.current.pollNow();
    }
  }, []);

  const pause = useCallback(() => {
    if (pollerRef.current) {
      pollerRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (pollerRef.current) {
      pollerRef.current.resume();
    }
  }, []);

  const getStatus = useCallback(() => {
    return pollerRef.current ? pollerRef.current.getStatus() : null;
  }, []);

  return {
    data,
    error,
    isLoading,
    lastUpdated,
    refresh,
    pause,
    resume,
    getStatus
  };
}

/**
 * Screen status polling hook - VERY CONSERVATIVE for production
 */
export function useScreenStatus(apiClient, options = {}) {
  return usePolling('screen-status', {
    interval: options.interval || 300000, // 5 minutes - very conservative for production
    fetchFunction: async ({ signal }) => {
      const response = await apiClient.getScreens();
      return response.screens || [];
    },
    enableChangeDetection: true,
    changeDetectionKey: (data) => {
      return data.map(screen => `${screen.id}-${screen.status}-${screen.last_heartbeat}`).join('|');
    },
    ...options
  }, [apiClient]);
}

/**
 * Dashboard data polling hook - VERY CONSERVATIVE for production
 */
export function useDashboardData(apiClient, options = {}) {
  return usePolling('dashboard-data', {
    interval: options.interval || 300000, // 5 minutes - very conservative for production
    fetchFunction: async ({ signal }) => {
      const [statsResponse, activityResponse, healthResponse, alertsResponse] = await Promise.all([
        apiClient.request('/api/dashboard/stats', { signal }),
        apiClient.request('/api/dashboard/activity?limit=10', { signal }),
        apiClient.request('/api/dashboard/health', { signal }),
        apiClient.request('/api/dashboard/alerts?limit=5', { signal })
      ]);
      
      return {
        stats: statsResponse,
        activity: activityResponse,
        health: healthResponse,
        alerts: alertsResponse
      };
    },
    enableChangeDetection: true,
    changeDetectionKey: (data) => {
      const stats = data.stats?.stats;
      const health = data.health?.health;
      return `${stats?.screens?.online}-${stats?.system?.healthScore}-${health?.overall}-${data.activity?.activity?.length}-${data.alerts?.alerts?.length}`;
    },
    ...options
  }, [apiClient]);
}

/**
 * Playlist updates polling hook
 */
export function usePlaylistUpdates(apiClient, options = {}) {
  return usePolling('playlist-updates', {
    interval: options.interval || 300000, // 5 minutes - very conservative for production
    fetchFunction: async ({ signal }) => {
      const response = await apiClient.getPlaylists();
      return response.playlists || [];
    },
    enableChangeDetection: true,
    changeDetectionKey: (data) => {
      return data.map(playlist => `${playlist.id}-${playlist.updated_at}`).join('|');
    },
    ...options
  }, [apiClient]);
}

/**
 * Media updates polling hook
 */
export function useMediaUpdates(apiClient, options = {}) {
  return usePolling('media-updates', {
    interval: options.interval || 300000, // 5 minutes - very conservative for production
    fetchFunction: async ({ signal }) => {
      const response = await apiClient.getMedia();
      return response.media || [];
    },
    enableChangeDetection: true,
    changeDetectionKey: (data) => {
      return data.map(media => `${media.id}-${media.updated_at}`).join('|');
    },
    ...options
  }, [apiClient]);
}

/**
 * Assignment updates polling hook
 */
export function useAssignmentUpdates(apiClient, options = {}) {
  return usePolling('assignment-updates', {
    interval: options.interval || 300000, // 5 minutes - very conservative for production
    fetchFunction: async ({ signal }) => {
      const response = await apiClient.getAssignments();
      return response.assignments || [];
    },
    enableChangeDetection: true,
    changeDetectionKey: (data) => {
      return data.map(assignment => `${assignment.screen_id}-${assignment.playlist_id}-${assignment.assigned_at}`).join('|');
    },
    ...options
  }, [apiClient]);
}

/**
 * System health polling hook
 */
export function useSystemHealth(apiClient, options = {}) {
  return usePolling('system-health', {
    interval: options.interval || 300000, // 5 minutes - very conservative for production
    fetchFunction: async ({ signal }) => {
      const response = await apiClient.request('/api/dashboard/health', { signal });
      return response.health;
    },
    enableChangeDetection: true,
    changeDetectionKey: (data) => {
      return `${data.overall}-${data.components?.database?.status}-${data.components?.storage?.status}-${data.components?.screens?.status}`;
    },
    ...options
  }, [apiClient]);
}

/**
 * Multi-poller hook for managing multiple pollers
 */
export function useMultiPolling(pollers, apiClient) {
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({});
  const [lastUpdated, setLastUpdated] = useState({});
  const pollersRef = useRef({});

  useEffect(() => {
    // Initialize all pollers
    pollers.forEach(({ id, config }) => {
      const pollerConfig = {
        ...config,
        onData: (newData, meta) => {
          setData(prev => ({ ...prev, [id]: newData }));
          setErrors(prev => ({ ...prev, [id]: null }));
          setLoading(prev => ({ ...prev, [id]: false }));
          setLastUpdated(prev => ({ ...prev, [id]: new Date() }));
          
          if (config.onData) {
            config.onData(newData, meta);
          }
        },
        onError: (error, meta) => {
          setErrors(prev => ({ ...prev, [id]: error }));
          setLoading(prev => ({ ...prev, [id]: false }));
          
          if (config.onError) {
            config.onError(error, meta);
          }
        }
      };

      // Set initial loading state
      setLoading(prev => ({ ...prev, [id]: true }));

      pollersRef.current[id] = pollingManager.createPoller(id, pollerConfig);
      pollersRef.current[id].start();
    });

    return () => {
      // Cleanup all pollers
      Object.keys(pollersRef.current).forEach(id => {
        pollingManager.stopPoller(id);
      });
      pollersRef.current = {};
    };
  }, [pollers, apiClient]);

  const refreshAll = useCallback(() => {
    Object.values(pollersRef.current).forEach(poller => {
      poller.pollNow();
    });
  }, []);

  const pauseAll = useCallback(() => {
    Object.values(pollersRef.current).forEach(poller => {
      poller.pause();
    });
  }, []);

  const resumeAll = useCallback(() => {
    Object.values(pollersRef.current).forEach(poller => {
      poller.resume();
    });
  }, []);

  const getStatus = useCallback(() => {
    const status = {};
    Object.entries(pollersRef.current).forEach(([id, poller]) => {
      status[id] = poller.getStatus();
    });
    return status;
  }, []);

  return {
    data,
    errors,
    loading,
    lastUpdated,
    refreshAll,
    pauseAll,
    resumeAll,
    getStatus
  };
}

/**
 * Polling status hook for monitoring all active pollers
 */
export function usePollingStatus() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const updateStatus = () => {
      setStatus(pollingManager.getStatus());
    };

    // Update status immediately
    updateStatus();

    // Update status every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const pauseAll = useCallback(() => {
    pollingManager.pauseAllPollers();
  }, []);

  const resumeAll = useCallback(() => {
    pollingManager.resumeAllPollers();
  }, []);

  const stopAll = useCallback(() => {
    pollingManager.stopAllPollers();
  }, []);

  return {
    status,
    pauseAll,
    resumeAll,
    stopAll
  };
}