const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.authContext = null; // Will be set by AuthContext
    this.maxRetries = 3;
    this.retryDelay = 1000; // Initial delay in ms
  }

  setAuthContext(context) {
    this.authContext = context;
  }

  async request(endpoint, options = {}, retryCount = 0) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const apiToken = localStorage.getItem('api_token');
      
      if (apiToken) {
        config.headers.Authorization = `Bearer ${apiToken}`;
        console.log('[ApiClient] Using API token for request', {
          endpoint,
          tokenType: 'API_TOKEN',
          retryCount,
          timestamp: new Date().toISOString()
        });
      } else {
        // Fall back to Supabase token if API token is missing
        const supabaseToken = this.authContext?.session?.access_token;
        
        if (supabaseToken) {
          config.headers.Authorization = `Bearer ${supabaseToken}`;
          console.log('[ApiClient] Using Supabase token as fallback', {
            endpoint,
            tokenType: 'SUPABASE_TOKEN',
            retryCount,
            timestamp: new Date().toISOString()
          });
        } else {
          console.log('[ApiClient] No token available for request', {
            endpoint,
            retryCount,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle 401 Unauthorized errors
        if (response.status === 401) {
          return this.handle401Error(endpoint, errorData, options, retryCount);
        }
        
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response;
    } catch (error) {
      // Check if it's a connection error
      if (error.message.includes('fetch') || error.name === 'TypeError') {
        return this.handleConnectionError(endpoint, error, options, retryCount);
      }
      
      console.error('[ApiClient] API request failed:', {
        endpoint,
        error: error.message,
        retryCount,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async handle401Error(endpoint, errorData, originalOptions, retryCount) {
    const errorCode = errorData.code || 'UNKNOWN';
    const token = typeof window !== 'undefined' ? localStorage.getItem('api_token') : null;
    
    console.error('[ApiClient] 401 Unauthorized error', {
      endpoint,
      errorCode,
      errorMessage: errorData.error,
      hasToken: !!token,
      tokenType: token ? 'API_TOKEN' : 'NONE',
      retryCount,
      timestamp: new Date().toISOString()
    });

    // Prevent infinite retry loops
    if (retryCount >= this.maxRetries) {
      console.error('[ApiClient] Max retries reached for 401 error', {
        endpoint,
        retryCount,
        timestamp: new Date().toISOString()
      });
      const error = new Error(errorData.error || 'Unauthorized - max retries exceeded');
      error.code = errorCode;
      error.status = 401;
      throw error;
    }

    // Distinguish between missing and invalid tokens
    if (!token) {
      console.log('[ApiClient] 401 error: Missing token');
    } else {
      console.log('[ApiClient] 401 error: Invalid or expired token');
    }

    // Trigger token refresh if AuthContext is available
    if (this.authContext?.ensureAPIToken) {
      console.log('[ApiClient] Attempting token refresh via AuthContext', {
        retryCount: retryCount + 1
      });
      
      try {
        const refreshed = await this.authContext.ensureAPIToken();
        if (refreshed) {
          console.log('[ApiClient] Token refresh successful, retrying request');
          // Retry the original request with new token
          return this.request(endpoint, originalOptions, retryCount + 1);
        } else {
          console.error('[ApiClient] Token refresh failed');
        }
      } catch (error) {
        console.error('[ApiClient] Error during token refresh:', {
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // If we can't refresh, throw the error
    const error = new Error(errorData.error || 'Unauthorized');
    error.code = errorCode;
    error.status = 401;
    throw error;
  }

  async handleConnectionError(endpoint, error, originalOptions, retryCount) {
    console.error('[ApiClient] Connection error detected', {
      endpoint,
      error: error.message,
      errorName: error.name,
      retryCount,
      timestamp: new Date().toISOString()
    });

    // Implement exponential backoff for connection errors
    if (retryCount < this.maxRetries) {
      const delay = this.retryDelay * Math.pow(2, retryCount);
      console.log('[ApiClient] Retrying connection after delay', {
        endpoint,
        retryCount: retryCount + 1,
        delayMs: delay,
        timestamp: new Date().toISOString()
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.request(endpoint, originalOptions, retryCount + 1);
    }

    console.error('[ApiClient] Max retries reached for connection error', {
      endpoint,
      retryCount,
      timestamp: new Date().toISOString()
    });

    const connectionError = new Error(
      'Unable to connect to backend server. Please ensure the backend is running on port 3001.'
    );
    connectionError.code = 'ERR_CONNECTION_REFUSED';
    connectionError.originalError = error;
    throw connectionError;
  }

  // Auth methods
  async login(supabaseToken) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ token: supabaseToken }),
    });

    // Return response - token storage is handled by AuthContext
    return response;
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      // Always clear local token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('api_token');
      }
    }
  }

  async getProfile() {
    return this.request('/api/auth/profile');
  }

  async updateProfile(profileData) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Media endpoints
  async uploadMedia(formData) {
    return this.request('/api/media/upload', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async getMedia() {
    return this.request('/api/media');
  }

  async deleteMedia(mediaId) {
    return this.request(`/api/media/${mediaId}`, {
      method: 'DELETE',
    });
  }

  async updateMedia(mediaId, updates) {
    return this.request(`/api/media/${mediaId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Screen endpoints
  async getScreens() {
    return this.request('/api/screens');
  }

  async createScreen(screenData) {
    return this.request('/api/screens', {
      method: 'POST',
      body: JSON.stringify(screenData),
    });
  }

  async updateScreen(screenId, updates) {
    return this.request(`/api/screens/${screenId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteScreen(screenId) {
    return this.request(`/api/screens/${screenId}`, {
      method: 'DELETE',
    });
  }

  // Playlist endpoints
  async getPlaylists(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/playlists?${queryString}` : '/api/playlists';
    return this.request(url);
  }

  async createPlaylist(playlistData) {
    return this.request('/api/playlists', {
      method: 'POST',
      body: JSON.stringify(playlistData),
    });
  }

  async updatePlaylist(playlistId, updates) {
    return this.request(`/api/playlists/${playlistId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePlaylist(playlistId) {
    return this.request(`/api/playlists/${playlistId}`, {
      method: 'DELETE',
    });
  }

  // Assignment endpoints
  async getAssignments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/assignments?${queryString}` : '/api/assignments';
    return this.request(url);
  }

  async assignPlaylist(screenId, playlistId) {
    return this.request('/api/assignments', {
      method: 'POST',
      body: JSON.stringify({ screenId, playlistId }),
    });
  }

  async removeAssignment(screenId) {
    return this.request(`/api/assignments/screen/${screenId}`, {
      method: 'DELETE',
    });
  }

  // Player endpoints (no auth required)
  async getPlayerContent(deviceCode) {
    return this.request(`/api/player/${deviceCode}`);
  }

  async sendHeartbeat(deviceCode) {
    return this.request(`/api/player/${deviceCode}/heartbeat`, {
      method: 'POST',
    });
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return this.request('/api/dashboard/stats');
  }

  async getDashboardActivity(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/dashboard/activity?${queryString}` : '/api/dashboard/activity';
    return this.request(url);
  }

  async getDashboardHealth() {
    return this.request('/api/dashboard/health');
  }

  async getDashboardMetrics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/dashboard/metrics?${queryString}` : '/api/dashboard/metrics';
    return this.request(url);
  }

  async getDashboardAlerts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/dashboard/alerts?${queryString}` : '/api/dashboard/alerts';
    return this.request(url);
  }

  // Monitoring endpoints
  async getSystemHealth() {
    return this.request('/api/monitoring/health');
  }

  async getSystemMetrics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/monitoring/metrics?${queryString}` : '/api/monitoring/metrics';
    return this.request(url);
  }

  async getSystemStatus() {
    return this.request('/api/monitoring/status');
  }

  async getPerformanceMetrics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/monitoring/performance?${queryString}` : '/api/monitoring/performance';
    return this.request(url);
  }

  async getErrorLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/monitoring/errors?${queryString}` : '/api/monitoring/errors';
    return this.request(url);
  }

  async getSystemAlerts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/monitoring/alerts?${queryString}` : '/api/monitoring/alerts';
    return this.request(url);
  }

  async getSystemDiagnostics() {
    return this.request('/api/monitoring/diagnostics');
  }

  async testError(errorData) {
    return this.request('/api/monitoring/test-error', {
      method: 'POST',
      body: JSON.stringify(errorData)
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();