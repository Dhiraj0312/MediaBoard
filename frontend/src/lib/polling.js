/**
 * Real-time Polling System for Digital Signage Platform
 * Provides efficient polling mechanisms with change detection and error handling
 */

// Global flag to disable all polling (for production safety)
const POLLING_DISABLED = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_DISABLE_POLLING === 'true';

// Request deduplication cache
const requestCache = new Map();

class PollingManager {
  constructor() {
    this.pollers = new Map();
    this.isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
    this.globalConfig = {
      retryAttempts: 3,
      retryDelay: 1000, // Base delay in ms
      maxRetryDelay: 30000, // Max delay in ms
      backoffMultiplier: 2,
      enableAdaptivePolling: true,
      minInterval: 1000, // Minimum polling interval
      maxInterval: 300000 // Maximum polling interval (5 minutes)
    };

    // Only setup listeners on client side
    if (typeof window !== 'undefined') {
      this.setupNetworkListeners();
      this.setupVisibilityListeners();
    }
  }

  /**
   * Create a new poller instance
   */
  createPoller(id, config) {
    if (this.pollers.has(id)) {
      console.warn(`Poller with id "${id}" already exists. Stopping existing poller.`);
      this.stopPoller(id);
    }

    const poller = new Poller(id, {
      ...this.globalConfig,
      ...config
    });

    this.pollers.set(id, poller);
    return poller;
  }

  /**
   * Get existing poller
   */
  getPoller(id) {
    return this.pollers.get(id);
  }

  /**
   * Stop and remove a poller
   */
  stopPoller(id) {
    const poller = this.pollers.get(id);
    if (poller) {
      poller.stop();
      this.pollers.delete(id);
    }
  }

  /**
   * Stop all pollers
   */
  stopAllPollers() {
    for (const [id, poller] of this.pollers) {
      poller.stop();
    }
    this.pollers.clear();
  }

  /**
   * Pause all pollers (e.g., when going offline)
   */
  pauseAllPollers() {
    for (const poller of this.pollers.values()) {
      poller.pause();
    }
  }

  /**
   * Resume all pollers
   */
  resumeAllPollers() {
    for (const poller of this.pollers.values()) {
      poller.resume();
    }
  }

  /**
   * Get status of all pollers
   */
  getStatus() {
    const status = {
      totalPollers: this.pollers.size,
      activePollers: 0,
      pausedPollers: 0,
      errorPollers: 0,
      isOnline: this.isOnline,
      pollers: {}
    };

    for (const [id, poller] of this.pollers) {
      const pollerStatus = poller.getStatus();
      status.pollers[id] = pollerStatus;
      
      if (pollerStatus.isActive) status.activePollers++;
      if (pollerStatus.isPaused) status.pausedPollers++;
      if (pollerStatus.hasError) status.errorPollers++;
    }

    return status;
  }

  /**
   * Setup network event listeners
   */
  setupNetworkListeners() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('online', () => {
      console.log('🌐 Network connection restored');
      this.isOnline = true;
      this.resumeAllPollers();
    });

    window.addEventListener('offline', () => {
      console.log('🌐 Network connection lost');
      this.isOnline = false;
      this.pauseAllPollers();
    });
  }

  /**
   * Setup page visibility listeners
   */
  setupVisibilityListeners() {
    if (typeof document === 'undefined') return;
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('📱 Page hidden, reducing polling frequency');
        for (const poller of this.pollers.values()) {
          poller.setBackgroundMode(true);
        }
      } else {
        console.log('📱 Page visible, restoring polling frequency');
        for (const poller of this.pollers.values()) {
          poller.setBackgroundMode(false);
        }
      }
    });
  }
}

class Poller {
  constructor(id, config) {
    this.id = id;
    this.config = {
      interval: 300000, // Default 5 minutes - VERY CONSERVATIVE for production
      fetchFunction: null,
      onData: null,
      onError: null,
      onChange: null,
      enableChangeDetection: true,
      changeDetectionKey: null, // Function to extract change detection key
      retryAttempts: 3,
      retryDelay: 1000,
      maxRetryDelay: 30000,
      backoffMultiplier: 2,
      enableAdaptivePolling: true,
      backgroundMultiplier: 3, // Multiply interval by this when in background
      ...config
    };

    this.state = {
      isActive: false,
      isPaused: false,
      hasError: false,
      lastData: null,
      lastChangeKey: null,
      currentInterval: this.config.interval,
      retryCount: 0,
      consecutiveErrors: 0,
      consecutiveSuccesses: 0,
      lastPollTime: null,
      lastSuccessTime: null,
      isBackgroundMode: false
    };

    this.timeoutId = null;
    this.abortController = null;

    // Validate required config
    if (!this.config.fetchFunction) {
      throw new Error('fetchFunction is required');
    }
  }

  /**
   * Start polling
   */
  start() {
    // Global safety check - don't start if polling is disabled
    if (POLLING_DISABLED) {
      console.warn(`🚫 Polling disabled globally - not starting poller "${this.id}"`);
      return;
    }

    // Emergency disable check from localStorage
    if (typeof window !== 'undefined' && localStorage.getItem('DISABLE_POLLING') === 'true') {
      console.warn(`🚨 Emergency polling disable active - not starting poller "${this.id}"`);
      return;
    }

    if (this.state.isActive) {
      console.warn(`Poller "${this.id}" is already active`);
      return;
    }

    console.log(`🔄 Starting poller "${this.id}" with ${this.config.interval}ms interval`);
    this.state.isActive = true;
    this.state.isPaused = false;
    this.state.hasError = false;
    this.scheduleNextPoll(0); // Start immediately
  }

  /**
   * Stop polling
   */
  stop() {
    console.log(`⏹️ Stopping poller "${this.id}"`);
    this.state.isActive = false;
    this.clearTimeout();
    this.abortCurrentRequest();
  }

  /**
   * Pause polling
   */
  pause() {
    if (!this.state.isActive) return;
    
    console.log(`⏸️ Pausing poller "${this.id}"`);
    this.state.isPaused = true;
    this.clearTimeout();
    this.abortCurrentRequest();
  }

  /**
   * Resume polling
   */
  resume() {
    if (!this.state.isActive || !this.state.isPaused) return;
    
    console.log(`▶️ Resuming poller "${this.id}"`);
    this.state.isPaused = false;
    this.scheduleNextPoll(1000); // Resume after 1 second
  }

  /**
   * Set background mode
   */
  setBackgroundMode(isBackground) {
    if (this.state.isBackgroundMode === isBackground) return;
    
    this.state.isBackgroundMode = isBackground;
    
    if (isBackground) {
      this.state.currentInterval = this.config.interval * this.config.backgroundMultiplier;
      console.log(`📱 Poller "${this.id}" entering background mode (${this.state.currentInterval}ms)`);
    } else {
      this.state.currentInterval = this.config.interval;
      console.log(`📱 Poller "${this.id}" entering foreground mode (${this.state.currentInterval}ms)`);
    }

    // Reschedule if active
    if (this.state.isActive && !this.state.isPaused) {
      this.clearTimeout();
      this.scheduleNextPoll(0);
    }
  }

  /**
   * Schedule next poll
   */
  scheduleNextPoll(delay = null) {
    if (!this.state.isActive || this.state.isPaused) return;

    const actualDelay = delay !== null ? delay : this.state.currentInterval;
    
    // Only schedule if we're in a browser environment
    if (typeof setTimeout !== 'undefined') {
      this.timeoutId = setTimeout(() => {
        this.executePoll();
      }, actualDelay);
    }
  }

  /**
   * Execute a single poll
   */
  async executePoll() {
    if (!this.state.isActive || this.state.isPaused) return;

    this.state.lastPollTime = Date.now();
    
    // Check for existing request to prevent duplicates
    const cacheKey = `${this.id}-poll`;
    if (requestCache.has(cacheKey)) {
      console.log(`🔄 Skipping duplicate request for "${this.id}"`);
      this.scheduleNextPoll();
      return;
    }

    this.abortController = new AbortController();
    
    // Mark request as in progress
    requestCache.set(cacheKey, true);

    try {
      const data = await this.config.fetchFunction({
        signal: this.abortController.signal,
        pollerId: this.id,
        lastData: this.state.lastData
      });

      this.handleSuccess(data);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`🚫 Poll aborted for "${this.id}"`);
        return;
      }
      
      this.handleError(error);
    } finally {
      // Clear request cache
      requestCache.delete(cacheKey);
    }
  }

  /**
   * Handle successful poll
   */
  handleSuccess(data) {
    this.state.hasError = false;
    this.state.retryCount = 0;
    this.state.consecutiveErrors = 0;
    this.state.consecutiveSuccesses++;
    this.state.lastSuccessTime = Date.now();

    // Change detection
    let hasChanged = false;
    if (this.config.enableChangeDetection) {
      const changeKey = this.config.changeDetectionKey 
        ? this.config.changeDetectionKey(data)
        : JSON.stringify(data);
      
      hasChanged = this.state.lastChangeKey !== null && this.state.lastChangeKey !== changeKey;
      this.state.lastChangeKey = changeKey;
    }

    // Store data
    this.state.lastData = data;

    // Adaptive polling based on success rate
    if (this.config.enableAdaptivePolling) {
      this.adjustPollingInterval();
    }

    // Call callbacks
    if (this.config.onData) {
      this.config.onData(data, {
        hasChanged,
        pollerId: this.id,
        consecutiveSuccesses: this.state.consecutiveSuccesses
      });
    }

    if (hasChanged && this.config.onChange) {
      this.config.onChange(data, this.state.lastData, {
        pollerId: this.id
      });
    }

    // Schedule next poll
    this.scheduleNextPoll();
  }

  /**
   * Handle poll error
   */
  handleError(error) {
    this.state.hasError = true;
    this.state.consecutiveErrors++;
    this.state.consecutiveSuccesses = 0;

    console.error(`❌ Poll error for "${this.id}":`, error);

    // Special handling for rate limit errors - CIRCUIT BREAKER
    let isRateLimitError = false;
    if (error.response?.status === 429 || error.message?.includes('Too many')) {
      isRateLimitError = true;
      console.warn(`🚦 Rate limit hit for "${this.id}", STOPPING POLLING COMPLETELY`);
      
      // CIRCUIT BREAKER: Stop polling completely on rate limit
      this.stop();
      return;
    }

    // Call error callback
    if (this.config.onError) {
      this.config.onError(error, {
        pollerId: this.id,
        retryCount: this.state.retryCount,
        consecutiveErrors: this.state.consecutiveErrors,
        isRateLimitError
      });
    }

    // Calculate retry delay with exponential backoff
    let retryDelay = this.config.retryDelay * Math.pow(this.config.backoffMultiplier, this.state.retryCount);
    
    // For any errors, use much longer delays
    retryDelay = Math.max(retryDelay, 120000); // At least 2 minutes for any error
    retryDelay = Math.min(retryDelay, this.config.maxRetryDelay);

    // Retry logic
    if (this.state.retryCount < this.config.retryAttempts) {
      this.state.retryCount++;

      console.log(`🔄 Retrying poll "${this.id}" in ${retryDelay}ms (attempt ${this.state.retryCount}/${this.config.retryAttempts})`);
      this.scheduleNextPoll(retryDelay);
    } else {
      console.error(`💥 Max retries exceeded for poller "${this.id}" - STOPPING COMPLETELY`);
      
      // CIRCUIT BREAKER: Stop polling completely after max retries
      this.stop();
    }
  }

  /**
   * Adjust polling interval based on performance
   */
  adjustPollingInterval() {
    if (!this.config.enableAdaptivePolling) return;

    const baseInterval = this.state.isBackgroundMode 
      ? this.config.interval * this.config.backgroundMultiplier
      : this.config.interval;

    // Decrease interval on consistent success
    if (this.state.consecutiveSuccesses >= 10) {
      this.state.currentInterval = Math.max(
        baseInterval * 0.8,
        this.config.minInterval || 1000
      );
    }
    // Reset to base interval after some successes
    else if (this.state.consecutiveSuccesses >= 5) {
      this.state.currentInterval = baseInterval;
    }
  }

  /**
   * Clear timeout
   */
  clearTimeout() {
    if (this.timeoutId && typeof clearTimeout !== 'undefined') {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Abort current request
   */
  abortCurrentRequest() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Get poller status
   */
  getStatus() {
    return {
      id: this.id,
      isActive: this.state.isActive,
      isPaused: this.state.isPaused,
      hasError: this.state.hasError,
      currentInterval: this.state.currentInterval,
      retryCount: this.state.retryCount,
      consecutiveErrors: this.state.consecutiveErrors,
      consecutiveSuccesses: this.state.consecutiveSuccesses,
      lastPollTime: this.state.lastPollTime,
      lastSuccessTime: this.state.lastSuccessTime,
      isBackgroundMode: this.state.isBackgroundMode,
      hasData: this.state.lastData !== null
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Update current interval if not in adaptive mode
    if (!this.config.enableAdaptivePolling) {
      this.state.currentInterval = this.state.isBackgroundMode 
        ? this.config.interval * this.config.backgroundMultiplier
        : this.config.interval;
    }
  }

  /**
   * Force immediate poll
   */
  pollNow() {
    if (!this.state.isActive) {
      console.warn(`Cannot poll now - poller "${this.id}" is not active`);
      return;
    }

    this.clearTimeout();
    this.executePoll();
  }
}

// Create global polling manager instance
export const pollingManager = new PollingManager();

// Export classes for direct use
export { PollingManager, Poller };

// Utility functions for common polling patterns
export const createScreenStatusPoller = (apiClient, onData, onError) => {
  return pollingManager.createPoller('screen-status', {
    interval: 300000, // 5 minutes - VERY CONSERVATIVE for production
    fetchFunction: async ({ signal }) => {
      const response = await apiClient.request('/api/screens', { signal });
      return response.screens || [];
    },
    onData,
    onError,
    enableChangeDetection: true,
    changeDetectionKey: (data) => {
      // Create change key based on screen statuses and heartbeats
      return data.map(screen => `${screen.id}-${screen.status}-${screen.last_heartbeat}`).join('|');
    }
  });
};

export const createPlaylistUpdatePoller = (apiClient, onData, onError) => {
  return pollingManager.createPoller('playlist-updates', {
    interval: 300000, // 5 minutes - VERY CONSERVATIVE for production
    fetchFunction: async ({ signal }) => {
      const response = await apiClient.request('/api/playlists', { signal });
      return response.playlists || [];
    },
    onData,
    onError,
    enableChangeDetection: true,
    changeDetectionKey: (data) => {
      // Create change key based on playlist update timestamps
      return data.map(playlist => `${playlist.id}-${playlist.updated_at}`).join('|');
    }
  });
};

export const createDashboardPoller = (apiClient, onData, onError) => {
  return pollingManager.createPoller('dashboard-stats', {
    interval: 300000, // 5 minutes - VERY CONSERVATIVE for production
    fetchFunction: async ({ signal }) => {
      const [statsResponse, activityResponse, healthResponse] = await Promise.all([
        apiClient.request('/api/dashboard/stats', { signal }),
        apiClient.request('/api/dashboard/activity?limit=10', { signal }),
        apiClient.request('/api/dashboard/health', { signal })
      ]);
      
      return {
        stats: statsResponse,
        activity: activityResponse,
        health: healthResponse
      };
    },
    onData,
    onError,
    enableChangeDetection: true,
    changeDetectionKey: (data) => {
      // Create change key based on key metrics
      const stats = data.stats?.stats;
      const health = data.health?.health;
      return `${stats?.screens?.online}-${stats?.system?.healthScore}-${health?.overall}-${data.activity?.activity?.length}`;
    }
  });
};