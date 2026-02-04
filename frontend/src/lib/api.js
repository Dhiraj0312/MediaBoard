const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
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
      const token = localStorage.getItem('api_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(supabaseToken) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ token: supabaseToken }),
    });

    // Store API token for future requests
    if (response.token && typeof window !== 'undefined') {
      localStorage.setItem('api_token', response.token);
    }

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