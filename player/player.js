// Digital Signage Web Player - Enhanced Version
class DigitalSignagePlayer {
    constructor() {
        // Configuration
        this.config = {
            apiUrl: this.getApiUrl(),
            heartbeatInterval: 30000, // 30 seconds
            playlistCheckInterval: 60000, // 60 seconds
            retryDelay: 5000, // 5 seconds
            maxRetries: 3,
            cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
            preloadNext: true,
            enableOfflineMode: true
        };
        
        // State
        this.deviceCode = null;
        this.currentPlaylist = null;
        this.currentItemIndex = 0;
        this.isPlaying = false;
        this.isFullscreen = false;
        this.isOnline = navigator.onLine;
        this.retryCount = 0;
        
        // Monitoring state
        this.startTime = Date.now();
        this.lastHeartbeatTime = null;
        this.playbackStats = {
            totalItemsPlayed: 0,
            totalPlaytime: 0,
            errorCount: 0,
            lastError: null
        };
        this.performanceMetrics = {
            memoryUsage: 0,
            loadTimes: [],
            frameDrops: 0
        };
        this.networkMetrics = {
            connectionType: this.getConnectionType(),
            downlink: this.getDownlink(),
            rtt: this.getRTT()
        };
        
        // Intervals and timeouts
        this.heartbeatInterval = null;
        this.playlistCheckInterval = null;
        this.itemTimeout = null;
        this.progressInterval = null;
        this.playlistRefreshTimeout = null;
        
        // Cache and preloading
        this.mediaCache = new Map();
        this.preloadedMedia = new Set();
        
        // DOM elements
        this.elements = {};
        
        this.init();
    }
    
    getApiUrl() {
        // Try to get API URL from environment or use default
        const hostname = window.location.hostname;
        const port = window.location.port;
        const protocol = window.location.protocol;
        
        // If we're running on the same server as the API
        if (port === '3001' || (!port && hostname !== 'localhost')) {
            return `${protocol}//${hostname}${port ? ':' + port : ''}`;
        }
        
        // Development fallback
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }
        
        // Production fallback - assume API is on same domain with port 3001
        return `${protocol}//${hostname}:3001`;
    }
    
    async init() {
        console.log('🎬 Digital Signage Player v2.0 starting...');
        
        // Initialize DOM elements
        this.initializeElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Check for saved device code
        const savedDeviceCode = localStorage.getItem('deviceCode');
        if (savedDeviceCode) {
            console.log(`📱 Found saved device code: ${savedDeviceCode}`);
            this.deviceCode = savedDeviceCode;
            this.showConnectedState();
            this.startServices();
            
            // Immediately check for playlist
            setTimeout(() => {
                console.log('📱 Auto-checking for playlist with saved device code');
                this.checkForPlaylist();
            }, 2000);
        } else {
            console.log('📱 No saved device code, showing input form');
            this.showDeviceCodeInput();
        }
        
        // Initialize cache
        this.initializeCache();
        
        // Start network monitoring
        this.startNetworkMonitoring();
        
        // Try to enter fullscreen on load
        this.requestFullscreen();
    }
    
    initializeElements() {
        this.elements = {
            content: document.getElementById('content'),
            statusIndicator: document.getElementById('statusIndicator'),
            networkStatus: document.getElementById('networkStatus'),
            playlistInfo: document.getElementById('playlistInfo'),
            playlistName: document.getElementById('playlistName'),
            itemInfo: document.getElementById('itemInfo'),
            progressBar: document.getElementById('progressBar'),
            fullscreenToggle: document.getElementById('fullscreenToggle'),
            deviceCode: document.getElementById('deviceCode'),
            deviceCodeInput: document.getElementById('deviceCodeInput'),
            connectButton: document.getElementById('connectButton')
        };
    }
    
    setupEventListeners() {
        // Connect button
        if (this.elements.connectButton) {
            this.elements.connectButton.addEventListener('click', () => {
                this.handleDeviceCodeSubmit();
            });
        }
        
        // Device code input
        if (this.elements.deviceCodeInput) {
            this.elements.deviceCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleDeviceCodeSubmit();
                }
            });
            
            // Auto-format input (uppercase, limit to alphanumeric)
            this.elements.deviceCodeInput.addEventListener('input', (e) => {
                let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                e.target.value = value;
                
                // Enable/disable connect button
                if (this.elements.connectButton) {
                    this.elements.connectButton.disabled = value.length < 4;
                }
            });
        }
        
        // Fullscreen toggle
        this.elements.fullscreenToggle.addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'f':
                case 'F':
                    this.toggleFullscreen();
                    break;
                case 'r':
                case 'R':
                    this.checkForPlaylist();
                    break;
                case 'Escape':
                    if (this.isFullscreen) {
                        this.exitFullscreen();
                    }
                    break;
            }
        });
        
        // Fullscreen change events
        document.addEventListener('fullscreenchange', () => {
            this.isFullscreen = !!document.fullscreenElement;
            document.body.classList.toggle('fullscreen-mode', this.isFullscreen);
        });
        
        // Network status monitoring
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateNetworkStatus();
            this.retryCount = 0;
            if (this.deviceCode) {
                this.checkForPlaylist();
            }
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateNetworkStatus();
        });
        
        // Visibility change (tab focus)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isOnline && this.deviceCode) {
                this.checkForPlaylist();
            }
        });
        
        // Error handling for media elements
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
                console.error('Media load error:', e.target.src);
                this.handleMediaError(e.target);
            }
        }, true);
    }
    
    getOrGenerateDeviceCode() {
        let code = localStorage.getItem('deviceCode');
        if (!code) {
            code = this.generateDeviceCode();
            localStorage.setItem('deviceCode', code);
        }
        return code;
    }
    
    generateDeviceCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    displayDeviceCode() {
        if (this.elements.deviceCode) {
            this.elements.deviceCode.textContent = this.deviceCode;
        }
    }
    
    showDeviceCodeInput() {
        this.updateStatus('loading', 'Waiting for device code');
        
        // Ensure the input form is visible and not replaced by other content
        this.fadeTransition(() => {
            this.elements.content.innerHTML = `
                <div class="pairing">
                    <h1>Digital Signage Player</h1>
                    <p>Enter the device code from your admin portal</p>
                    <div class="device-input-container">
                        <input type="text" 
                               id="deviceCodeInput" 
                               class="device-code-input" 
                               placeholder="Enter device code..."
                               maxlength="8"
                               autocomplete="off">
                        <button id="connectButton" class="connect-button">Connect</button>
                    </div>
                    <p class="help-text">Get the device code from the Screens section in your admin dashboard</p>
                    <p style="margin-top: 2rem; font-size: 0.9rem; color: #888;">
                        Press 'F' for fullscreen • Press 'R' to refresh
                    </p>
                </div>
            `;
            
            // Re-initialize elements and event listeners after content change
            this.initializeElements();
            this.setupEventListeners();
        });
        
        // Focus on input after a short delay
        setTimeout(() => {
            if (this.elements.deviceCodeInput) {
                this.elements.deviceCodeInput.focus();
            }
        }, 300);
    }
    
    showConnectedState() {
        console.log(`📱 Showing connected state for device: ${this.deviceCode}`);
        
        // Replace content with connected state
        this.fadeTransition(() => {
            this.elements.content.innerHTML = `
                <div class="pairing">
                    <h1>Digital Signage Player</h1>
                    <p>Connected and loading content...</p>
                    <div class="device-code">${this.deviceCode}</div>
                    <p>Device is paired and checking for playlists</p>
                    <p style="margin-top: 1rem; font-size: 1rem; color: #888;">
                        Loading playlist content...
                    </p>
                    <button onclick="window.player.resetConnection()" 
                            style="margin-top: 2rem; padding: 0.5rem 1rem; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Change Device Code
                    </button>
                    <p style="margin-top: 2rem; font-size: 0.9rem; color: #888;">
                        Press 'F' for fullscreen • Press 'R' to refresh
                    </p>
                </div>
            `;
        });
        
        // Update status
        this.updateStatus('loading', 'Connected, loading content...');
        
        // Start checking for playlist immediately
        setTimeout(() => {
            this.checkForPlaylist();
        }, 1000);
    }
    
    async handleDeviceCodeSubmit() {
        const inputCode = this.elements.deviceCodeInput?.value?.trim().toUpperCase();
        
        if (!inputCode || inputCode.length < 4) {
            this.showError('Please enter a valid device code');
            return;
        }
        
        console.log(`📱 Attempting to connect with device code: ${inputCode}`);
        
        // Disable the connect button during connection attempt
        if (this.elements.connectButton) {
            this.elements.connectButton.disabled = true;
            this.elements.connectButton.textContent = 'Connecting...';
        }
        
        this.updateStatus('loading', 'Connecting...');
        
        try {
            // Test the device code by trying to fetch playlist
            const response = await fetch(`${this.config.apiUrl}/api/player/${inputCode}`);
            
            if (response.ok || response.status === 404) {
                // 404 is also acceptable - it means the device code is valid but no playlist assigned yet
                this.deviceCode = inputCode;
                localStorage.setItem('deviceCode', inputCode);
                
                console.log(`✅ Device code accepted: ${inputCode}`);
                this.showConnectedState();
                this.startServices();
                
                // Check for playlist immediately
                this.checkForPlaylist();
                
            } else if (response.status === 400) {
                throw new Error('Invalid device code format');
            } else {
                throw new Error(`Connection failed (${response.status})`);
            }
            
        } catch (error) {
            console.error('❌ Device code connection failed:', error);
            this.showError(`Connection failed: ${error.message}`);
            
            // Re-enable the connect button
            if (this.elements.connectButton) {
                this.elements.connectButton.disabled = false;
                this.elements.connectButton.textContent = 'Connect';
            }
        }
    }
    
    startServices() {
        if (this.deviceCode) {
            this.startHeartbeat();
            this.startPlaylistCheck();
            console.log(`📱 Services started for device: ${this.deviceCode}`);
        }
    }
    
    resetConnection() {
        // Clear saved device code
        localStorage.removeItem('deviceCode');
        this.deviceCode = null;
        
        // Stop services
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.playlistCheckInterval) {
            clearInterval(this.playlistCheckInterval);
            this.playlistCheckInterval = null;
        }
        
        // Stop playback
        this.stopPlayback();
        
        // Show input form again
        this.showDeviceCodeInput();
        
        console.log('🔄 Connection reset, ready for new device code');
    }
    
    initializeCache() {
        // Load cached media info from localStorage
        try {
            const cached = localStorage.getItem('mediaCache');
            if (cached) {
                const cacheData = JSON.parse(cached);
                // Check if cache is still valid
                if (Date.now() - cacheData.timestamp < this.config.cacheExpiry) {
                    this.mediaCache = new Map(cacheData.data);
                    console.log(`💾 Loaded ${this.mediaCache.size} items from cache`);
                } else {
                    console.log('💾 Cache expired, clearing old data');
                    this.clearExpiredCache();
                }
            }
            
            // Load cached playlist if available
            this.loadCachedPlaylist();
            
        } catch (error) {
            console.error('Cache initialization error:', error);
            this.clearCache();
        }
    }
    
    loadCachedPlaylist() {
        try {
            const cachedPlaylist = localStorage.getItem('cachedPlaylist');
            if (cachedPlaylist) {
                const playlistData = JSON.parse(cachedPlaylist);
                if (Date.now() - playlistData.timestamp < this.config.cacheExpiry) {
                    console.log('💾 Loaded cached playlist for offline mode');
                    // Don't auto-start cached playlist, wait for online check first
                }
            }
        } catch (error) {
            console.error('Failed to load cached playlist:', error);
        }
    }
    
    clearExpiredCache() {
        try {
            localStorage.removeItem('mediaCache');
            localStorage.removeItem('cachedPlaylist');
            this.mediaCache.clear();
            this.preloadedMedia.clear();
        } catch (error) {
            console.error('Failed to clear expired cache:', error);
        }
    }
    
    clearCache() {
        try {
            localStorage.removeItem('mediaCache');
            localStorage.removeItem('cachedPlaylist');
            this.mediaCache.clear();
            this.preloadedMedia.clear();
            console.log('💾 Cache cleared');
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    }
    
    saveCache() {
        try {
            // Save media cache
            const cacheData = {
                timestamp: Date.now(),
                data: Array.from(this.mediaCache.entries())
            };
            localStorage.setItem('mediaCache', JSON.stringify(cacheData));
            
            // Save current playlist for offline mode
            if (this.currentPlaylist) {
                const playlistData = {
                    timestamp: Date.now(),
                    playlist: this.currentPlaylist
                };
                localStorage.setItem('cachedPlaylist', JSON.stringify(playlistData));
            }
            
            console.log('💾 Cache saved successfully');
        } catch (error) {
            console.error('Cache save error:', error);
            // If storage is full, try to clear some space
            if (error.name === 'QuotaExceededError') {
                this.clearExpiredCache();
            }
        }
    }
    
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, this.config.heartbeatInterval);
        
        // Send initial heartbeat
        this.sendHeartbeat();
    }
    
    async sendHeartbeat() {
        if (!this.isOnline || !this.deviceCode) return;
        
        try {
            const playerInfo = {
                userAgent: navigator.userAgent,
                screenResolution: `${screen.width}x${screen.height}`,
                isFullscreen: this.isFullscreen,
                currentPlaylist: this.currentPlaylist?.id || null,
                currentItem: this.currentItemIndex,
                isPlaying: this.isPlaying,
                // Enhanced monitoring data
                playbackStats: this.getPlaybackStats(),
                performanceMetrics: this.getPerformanceMetrics(),
                networkStatus: this.getNetworkStatus(),
                cacheStatus: this.getCacheStatus(),
                errorCount: this.getErrorCount(),
                uptime: this.getUptime()
            };
            
            const response = await fetch(`${this.config.apiUrl}/api/player/${this.deviceCode}/heartbeat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'online',
                    playerInfo
                })
            });
            
            if (response.ok) {
                console.log('💓 Heartbeat sent successfully');
                this.updateStatus('online', 'Connected');
                this.retryCount = 0;
                this.lastHeartbeatTime = Date.now();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Heartbeat failed:', error);
            this.handleConnectionError();
        }
    }
    
    startPlaylistCheck() {
        this.playlistCheckInterval = setInterval(() => {
            this.checkForPlaylist();
        }, this.config.playlistCheckInterval);
        
        // Check immediately
        this.checkForPlaylist();
    }
    
    async checkForPlaylist() {
        if (!this.isOnline) {
            console.log('📋 Offline mode - using cached playlist');
            return;
        }
        
        if (!this.deviceCode) {
            console.log('📋 No device code set, showing pairing screen');
            this.showPairingScreen();
            return;
        }
        
        const checkStartTime = Date.now();
        console.log(`📋 Checking for playlist with device code: ${this.deviceCode}`);
        
        try {
            const response = await fetch(`${this.config.apiUrl}/api/player/${this.deviceCode}`);
            
            // Record response time
            const responseTime = Date.now() - checkStartTime;
            this.recordLoadTime(responseTime);
            
            console.log(`📋 API Response: ${response.status} (${responseTime}ms)`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📋 API Response data:', data);
                
                if (data.success && data.content && data.content.length > 0) {
                    console.log(`📋 Found playlist: ${data.playlist.name} with ${data.content.length} items`);
                    
                    const playlist = {
                        id: data.playlist.id,
                        name: data.playlist.name,
                        items: data.content.map(item => ({
                            id: item.id,
                            type: item.media.type,
                            url: item.media.url,
                            name: item.media.name,
                            duration: item.duration,
                            order: item.order
                        })),
                        updated_at: data.timestamp,
                        checksum: this.calculatePlaylistChecksum(data.content)
                    };
                    
                    console.log('📋 Formatted playlist:', {
                        name: playlist.name,
                        itemCount: playlist.items.length,
                        firstItem: playlist.items[0] ? {
                            name: playlist.items[0].name,
                            type: playlist.items[0].type,
                            url: playlist.items[0].url
                        } : null
                    });
                    
                    // Enhanced playlist change detection
                    const hasChanged = this.hasPlaylistChanged(playlist);
                    
                    if (hasChanged) {
                        console.log('📋 Playlist updated:', playlist.name);
                        console.log('📊 Change type:', this.getChangeType(playlist));
                        
                        this.currentPlaylist = playlist;
                        await this.preloadPlaylistMedia();
                        this.startPlayback();
                        
                        // Report playlist change
                        this.reportPlaylistChange(playlist);
                    } else {
                        console.log('📋 Playlist unchanged, continuing playback');
                    }
                    
                    // Update status to show we have content
                    this.updateStatus('online', `Playing: ${playlist.name}`);
                } else {
                    console.log('📋 No content in playlist or empty response');
                    console.log('📋 Response details:', {
                        success: data.success,
                        contentLength: data.content?.length || 0,
                        message: data.message
                    });
                    this.updateStatus('online', 'Waiting for content');
                    this.showPairingScreen();
                }
            } else if (response.status === 404) {
                console.log('📋 Screen not registered or no playlist assigned (404)');
                this.updateStatus('online', 'Device paired, waiting for playlist');
                this.showPairingScreen();
            } else if (response.status === 400) {
                console.log('📋 Invalid device code (400)');
                this.updateStatus('offline', 'Invalid device code');
                this.showError('Invalid device code. Please check and try again.');
                // Reset connection to allow re-entering device code
                setTimeout(() => {
                    this.resetConnection();
                }, 3000);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Playlist check failed:', error);
            this.recordError(error);
            this.handleConnectionError();
        }
    }
    
    calculatePlaylistChecksum(content) {
        // Simple checksum based on content IDs and durations
        const data = content.map(item => `${item.id}-${item.duration}`).join('|');
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }
    
    hasPlaylistChanged(newPlaylist) {
        if (!this.currentPlaylist) return true;
        
        // Check multiple change indicators
        return (
            this.currentPlaylist.id !== newPlaylist.id ||
            this.currentPlaylist.updated_at !== newPlaylist.updated_at ||
            this.currentPlaylist.checksum !== newPlaylist.checksum ||
            this.currentPlaylist.items.length !== newPlaylist.items.length
        );
    }
    
    getChangeType(newPlaylist) {
        if (!this.currentPlaylist) return 'new';
        
        if (this.currentPlaylist.id !== newPlaylist.id) return 'different_playlist';
        if (this.currentPlaylist.items.length !== newPlaylist.items.length) return 'items_changed';
        if (this.currentPlaylist.checksum !== newPlaylist.checksum) return 'content_updated';
        if (this.currentPlaylist.updated_at !== newPlaylist.updated_at) return 'metadata_updated';
        
        return 'unknown';
    }
    
    async reportPlaylistChange(playlist) {
        try {
            await fetch(`${this.config.apiUrl}/api/player/${this.deviceCode}/playlist-change`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playlistId: playlist.id,
                    playlistName: playlist.name,
                    itemCount: playlist.items.length,
                    changeType: this.getChangeType(playlist),
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.warn('Failed to report playlist change:', error);
        }
    }
    
    async preloadPlaylistMedia() {
        if (!this.currentPlaylist || !this.config.preloadNext) return;
        
        console.log('⬇️ Preloading playlist media...');
        
        const preloadPromises = [];
        let preloadedCount = 0;
        
        for (const item of this.currentPlaylist.items) {
            if (!this.preloadedMedia.has(item.url)) {
                const preloadPromise = this.preloadMediaItem(item)
                    .then(() => {
                        preloadedCount++;
                        console.log(`✅ Preloaded ${preloadedCount}/${this.currentPlaylist.items.length}: ${item.name}`);
                    })
                    .catch(error => {
                        console.warn(`⚠️ Failed to preload ${item.name}:`, error);
                    });
                
                preloadPromises.push(preloadPromise);
                
                // Limit concurrent preloads to avoid overwhelming the network
                if (preloadPromises.length >= 3) {
                    await Promise.allSettled(preloadPromises.splice(0, 3));
                }
            }
        }
        
        // Wait for remaining preloads
        if (preloadPromises.length > 0) {
            await Promise.allSettled(preloadPromises);
        }
        
        this.saveCache();
        console.log(`✅ Preloading complete: ${preloadedCount} new items, ${this.preloadedMedia.size} total cached`);
    }
    
    async preloadMediaItem(item) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Preload timeout'));
            }, 15000); // 15 second timeout
            
            if (item.type === 'image') {
                const img = new Image();
                img.onload = () => {
                    clearTimeout(timeout);
                    this.preloadedMedia.add(item.url);
                    this.mediaCache.set(item.url, {
                        type: item.type,
                        preloaded: true,
                        timestamp: Date.now(),
                        size: img.naturalWidth * img.naturalHeight // Approximate size
                    });
                    resolve();
                };
                img.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error('Image load failed'));
                };
                img.src = item.url;
            } else if (item.type === 'video') {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = () => {
                    clearTimeout(timeout);
                    this.preloadedMedia.add(item.url);
                    this.mediaCache.set(item.url, {
                        type: item.type,
                        preloaded: true,
                        timestamp: Date.now(),
                        duration: video.duration
                    });
                    resolve();
                };
                video.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error('Video metadata load failed'));
                };
                video.src = item.url;
            } else {
                clearTimeout(timeout);
                reject(new Error('Unknown media type'));
            }
        });
    }
    
    handleConnectionError() {
        this.retryCount++;
        
        if (this.retryCount <= this.config.maxRetries) {
            this.updateStatus('loading', `Retrying... (${this.retryCount}/${this.config.maxRetries})`);
            setTimeout(() => {
                this.checkForPlaylist();
            }, this.config.retryDelay * this.retryCount);
        } else {
            this.updateStatus('offline', 'Connection failed');
            
            // Try to use cached content
            if (this.config.enableOfflineMode) {
                this.enterOfflineMode();
            } else {
                this.showError('Connection lost. Please check your network connection.');
            }
        }
    }
    
    async enterOfflineMode() {
        console.log('📱 Entering offline mode');
        
        // Try to use current playlist if available
        if (this.currentPlaylist && this.currentPlaylist.items.length > 0) {
            this.showError('Connection lost. Playing cached content...');
            setTimeout(() => {
                this.startPlayback();
            }, 3000);
            return;
        }
        
        // Try to load cached playlist
        try {
            const cachedPlaylist = localStorage.getItem('cachedPlaylist');
            if (cachedPlaylist) {
                const playlistData = JSON.parse(cachedPlaylist);
                if (Date.now() - playlistData.timestamp < this.config.cacheExpiry) {
                    console.log('📱 Using cached playlist for offline mode');
                    this.currentPlaylist = playlistData.playlist;
                    this.showError('Connection lost. Playing cached content...');
                    setTimeout(() => {
                        this.startPlayback();
                    }, 3000);
                    return;
                }
            }
        } catch (error) {
            console.error('Failed to load cached playlist:', error);
        }
        
        // No cached content available
        this.showError('Connection lost and no cached content available. Please check your network connection.');
    }
    
    updateStatus(status, message) {
        const indicator = this.elements.statusIndicator;
        indicator.className = `status-indicator status-${status}`;
        indicator.textContent = message;
    }
    
    updateNetworkStatus() {
        const networkStatus = this.elements.networkStatus;
        networkStatus.className = `network-status network-${this.isOnline ? 'online' : 'offline'}`;
        networkStatus.textContent = this.isOnline ? 'Online' : 'Offline';
    }
    
    showPairingScreen() {
        this.stopPlayback();
        
        if (!this.deviceCode) {
            // Show device code input form
            this.fadeTransition(() => {
                this.elements.content.innerHTML = `
                    <div class="pairing">
                        <h1>Digital Signage Player</h1>
                        <p>Enter the device code from your admin portal</p>
                        <div class="device-input-container">
                            <input type="text" 
                                   id="deviceCodeInput" 
                                   class="device-code-input" 
                                   placeholder="Enter device code..."
                                   maxlength="8"
                                   autocomplete="off">
                            <button id="connectButton" class="connect-button">Connect</button>
                        </div>
                        <p class="help-text">Get the device code from the Screens section in your admin dashboard</p>
                        <p style="margin-top: 2rem; font-size: 0.9rem; color: #888;">
                            Press 'F' for fullscreen • Press 'R' to refresh
                        </p>
                    </div>
                `;
                
                // Re-initialize elements and event listeners for the new form
                this.initializeElements();
                this.setupEventListeners();
            });
        } else {
            // Show connected but waiting for content
            this.fadeTransition(() => {
                this.elements.content.innerHTML = `
                    <div class="pairing">
                        <h1>Digital Signage Player</h1>
                        <p>Connected and waiting for content</p>
                        <div class="device-code">${this.deviceCode}</div>
                        <p>Device is paired and ready to display content</p>
                        <p style="margin-top: 1rem; font-size: 1rem; color: #888;">
                            Assign a playlist to this screen in the admin portal
                        </p>
                        <button onclick="window.player.resetConnection()" 
                                style="margin-top: 2rem; padding: 0.5rem 1rem; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            Change Device Code
                        </button>
                        <p style="margin-top: 2rem; font-size: 0.9rem; color: #888;">
                            Press 'F' for fullscreen • Press 'R' to refresh
                        </p>
                    </div>
                `;
            });
        }
        
        this.hidePlaylistInfo();
    }
    
    showError(message) {
        this.fadeTransition(() => {
            const deviceCodeDisplay = this.deviceCode ? 
                `<p style="margin-top: 1rem; font-size: 1rem;">
                    Device Code: <strong>${this.deviceCode}</strong>
                </p>` : 
                `<button onclick="window.player.showPairingScreen()" 
                        style="margin-top: 1rem; padding: 0.5rem 1rem; background: #4A90E2; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Back to Connection
                </button>`;
                
            this.elements.content.innerHTML = `
                <div class="error">
                    <h2>⚠️ ${message}</h2>
                    ${deviceCodeDisplay}
                </div>
            `;
        });
        this.hidePlaylistInfo();
    }
    
    showLoading(message = 'Loading content...') {
        this.fadeTransition(() => {
            this.elements.content.innerHTML = `<div class="loading">${message}</div>`;
        });
    }
    
    fadeTransition(callback) {
        this.elements.content.classList.remove('show');
        setTimeout(() => {
            callback();
            this.elements.content.classList.add('show');
        }, 250);
    }
    
    async startPlayback() {
        if (!this.currentPlaylist || !this.currentPlaylist.items.length) {
            return;
        }
        
        this.isPlaying = true;
        this.currentItemIndex = 0;
        this.showPlaylistInfo();
        
        // Calculate total playlist duration for scheduling
        const totalDuration = this.currentPlaylist.items.reduce((sum, item) => sum + item.duration, 0);
        console.log(`🎬 Starting playback: ${this.currentPlaylist.name} (${this.currentPlaylist.items.length} items, ${totalDuration}s total)`);
        
        // Start content rotation
        this.playCurrentItem();
        
        // Schedule next playlist check based on total duration
        this.schedulePlaylistRefresh(totalDuration);
    }
    
    stopPlayback() {
        this.isPlaying = false;
        this.clearItemTimeout();
        this.clearProgressInterval();
        this.clearPlaylistRefreshTimeout();
        this.hidePlaylistInfo();
    }
    
    schedulePlaylistRefresh(totalDuration) {
        // Clear any existing refresh timeout
        this.clearPlaylistRefreshTimeout();
        
        // Schedule a playlist check after the current loop completes
        // This ensures we check for updates at natural break points
        const refreshDelay = Math.max(totalDuration * 1000, 30000); // At least 30 seconds
        this.playlistRefreshTimeout = setTimeout(() => {
            if (this.isPlaying && this.isOnline) {
                console.log('🔄 Scheduled playlist refresh');
                this.checkForPlaylist();
            }
        }, refreshDelay);
    }
    
    clearPlaylistRefreshTimeout() {
        if (this.playlistRefreshTimeout) {
            clearTimeout(this.playlistRefreshTimeout);
            this.playlistRefreshTimeout = null;
        }
    }
    
    async playCurrentItem() {
        if (!this.currentPlaylist || !this.isPlaying) {
            return;
        }
        
        const item = this.currentPlaylist.items[this.currentItemIndex];
        if (!item) {
            return;
        }
        
        console.log(`🎬 Playing item ${this.currentItemIndex + 1}/${this.currentPlaylist.items.length}: ${item.name}`);
        
        this.updatePlaylistInfo(item);
        this.startProgressBar(item.duration);
        
        try {
            if (item.type === 'image') {
                await this.playImage(item);
            } else if (item.type === 'video') {
                await this.playVideo(item);
            }
        } catch (error) {
            console.error('Media playback error:', error);
            this.handleMediaError();
        }
    }
    
    async playImage(item) {
        const playStartTime = Date.now();
        console.log(`🖼️ Playing image: ${item.name}`);
        console.log(`🖼️ Image URL: ${item.url}`);
        
        return new Promise((resolve) => {
            this.fadeTransition(() => {
                this.elements.content.innerHTML = `
                    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #333;">
                        <img crossorigin="anonymous"
                             src="${item.url}" 
                             class="media-content" 
                             alt="${item.name}"
                             style="max-width: 100%; max-height: 100%; object-fit: contain; opacity: 0; transition: opacity 0.5s;">
                    </div>
                `;
                
                // Wait for DOM to update after fadeTransition completes, then get the image element
                setTimeout(() => {
                    const img = this.elements.content.querySelector('img');
                    
                    // Check if image element exists
                    if (!img) {
                        console.error(`❌ Image element not found for: ${item.name}`);
                        this.recordError(`Image element not found: ${item.name}`);
                        this.handleMediaError();
                        resolve();
                        return;
                    }
                    
                    let hasLoaded = false;
                    let hasErrored = false;
                    
                    // Set up load timeout - reduced to 5 seconds
                    const loadTimeout = setTimeout(() => {
                        if (!hasLoaded && !hasErrored) {
                            console.warn(`⏰ Image load timeout: ${item.name}`);
                            console.warn(`🖼️ Failed URL: ${item.url}`);
                            
                            // Check if image actually loaded but events didn't fire
                            if (img && img.complete && img.naturalWidth > 0) {
                                console.log(`✅ Image was actually loaded, showing it: ${item.name}`);
                                img.style.opacity = '1';
                                hasLoaded = true;
                            } else {
                                this.recordError(`Image load timeout: ${item.name}`);
                                this.handleMediaError(img);
                                resolve();
                                return;
                            }
                        }
                    }, 5000);
                    
                    img.addEventListener('load', () => {
                        if (hasLoaded || hasErrored) return;
                        hasLoaded = true;
                        clearTimeout(loadTimeout);
                        const loadTime = Date.now() - playStartTime;
                        this.recordLoadTime(loadTime);
                        console.log(`✅ Image loaded successfully: ${item.name} (${loadTime}ms)`);
                        console.log(`🖼️ Image dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
                        
                        // Make image visible
                        img.style.opacity = '1';
                    });
                    
                    img.addEventListener('error', (e) => {
                        if (hasLoaded || hasErrored) return;
                        hasErrored = true;
                        clearTimeout(loadTimeout);
                        console.error(`❌ Image failed to load: ${item.name}`);
                        console.error(`🖼️ Failed URL: ${item.url}`);
                        console.error(`🖼️ Error event:`, e);
                        this.recordError(`Image load failed: ${item.name}`);
                        this.handleMediaError(img);
                        resolve();
                    });
                    
                    // Check if image is already loaded (cached)
                    if (img.complete && img.naturalWidth > 0) {
                        console.log(`✅ Image already loaded from cache: ${item.name}`);
                        img.style.opacity = '1';
                        hasLoaded = true;
                        clearTimeout(loadTimeout);
                        const loadTime = Date.now() - playStartTime;
                        this.recordLoadTime(loadTime);
                    }
                    
                }, 100); // Wait for fadeTransition to complete DOM update
            });
            
            // Show for specified duration
            this.itemTimeout = setTimeout(() => {
                this.recordItemPlayed(item.duration);
                console.log(`⏰ Image display time completed: ${item.name}`);
                resolve();
                this.nextItem();
            }, item.duration * 1000);
        });
    }
    
    async playVideo(item) {
        const playStartTime = Date.now();
        
        return new Promise((resolve) => {
            this.fadeTransition(() => {
                this.elements.content.innerHTML = `
                    <video class="media-content" 
                           autoplay 
                           muted 
                           playsinline
                           style="opacity:0; transition: opacity 0.5s;">
                        <source src="${item.url}" type="video/mp4">
                        <source src="${item.url}" type="video/webm">
                        Your browser does not support the video tag.
                    </video>
                `;
            });
            
            const video = this.elements.content.querySelector('video');
            let hasEnded = false;
            
            // Set up load timeout
            const loadTimeout = setTimeout(() => {
                if (!hasEnded) {
                    console.warn(`Video load timeout: ${item.name}`);
                    this.recordError(`Video load timeout: ${item.name}`);
                    this.handleMediaError(video);
                    resolve();
                }
            }, 15000);
            
            video.addEventListener('loadeddata', () => {
                video.style.opacity = '1';
                const loadTime = Date.now() - playStartTime;
                this.recordLoadTime(loadTime);
                console.log(`✅ Video loaded: ${item.name} (${loadTime}ms)`);
            });
            
            video.addEventListener('ended', () => {
                hasEnded = true;
                clearTimeout(loadTimeout);
                console.log(`✅ Video ended: ${item.name}`);
                this.recordItemPlayed(item.duration);
                resolve();
                this.nextItem();
            });
            
            video.addEventListener('error', (e) => {
                hasEnded = true;
                clearTimeout(loadTimeout);
                console.error(`❌ Video error: ${item.name}`, e);
                this.recordError(`Video playback error: ${item.name}`);
                this.handleMediaError(video);
                resolve();
            });
            
            // Monitor video playback quality
            video.addEventListener('progress', () => {
                // Track buffering progress
                if (video.buffered.length > 0) {
                    const bufferedEnd = video.buffered.end(video.buffered.length - 1);
                    const duration = video.duration;
                    if (duration > 0) {
                        const bufferHealth = (bufferedEnd / duration) * 100;
                        if (bufferHealth < 50) {
                            console.warn(`Low buffer health: ${bufferHealth.toFixed(1)}%`);
                        }
                    }
                }
            });
            
            // Fallback timeout in case video doesn't fire ended event
            this.itemTimeout = setTimeout(() => {
                if (!hasEnded) {
                    hasEnded = true;
                    clearTimeout(loadTimeout);
                    console.log(`⏰ Video duration timeout: ${item.name}`);
                    this.recordItemPlayed(item.duration);
                    resolve();
                    this.nextItem();
                }
            }, item.duration * 1000);
        });
    }
    
    handleMediaError(mediaElement = null) {
        console.error('Media error occurred', mediaElement?.src || 'unknown source');
        
        // Report error to server for monitoring
        this.reportError('Media playback failed', {
            mediaUrl: mediaElement?.src || 'unknown',
            mediaType: mediaElement?.tagName || 'unknown',
            currentItem: this.currentItemIndex,
            playlist: this.currentPlaylist?.name || 'none'
        });
        
        // Try to skip to next item
        setTimeout(() => {
            this.nextItem();
        }, 2000);
    }
    
    nextItem() {
        if (!this.currentPlaylist || !this.isPlaying) {
            return;
        }
        
        this.clearItemTimeout();
        this.clearProgressInterval();
        
        this.currentItemIndex++;
        if (this.currentItemIndex >= this.currentPlaylist.items.length) {
            this.currentItemIndex = 0; // Loop back to start
        }
        
        // Small delay between items for smooth transition
        setTimeout(() => {
            this.playCurrentItem();
        }, 500);
    }
    
    clearItemTimeout() {
        if (this.itemTimeout) {
            clearTimeout(this.itemTimeout);
            this.itemTimeout = null;
        }
    }
    
    clearProgressInterval() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }
    
    showPlaylistInfo() {
        if (this.currentPlaylist) {
            this.elements.playlistName.textContent = this.currentPlaylist.name;
            this.elements.playlistInfo.classList.add('show');
        }
    }
    
    hidePlaylistInfo() {
        this.elements.playlistInfo.classList.remove('show');
    }
    
    updatePlaylistInfo(item) {
        this.elements.itemInfo.textContent = 
            `${this.currentItemIndex + 1}/${this.currentPlaylist.items.length} - ${item.name}`;
    }
    
    startProgressBar(duration) {
        this.elements.progressBar.style.width = '0%';
        
        const startTime = Date.now();
        const durationMs = duration * 1000;
        
        this.progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / durationMs) * 100, 100);
            this.elements.progressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                this.clearProgressInterval();
            }
        }, 100);
    }
    
    startNetworkMonitoring() {
        this.updateNetworkStatus();
        
        // Enhanced network monitoring
        this.startConnectionQualityMonitoring();
        this.startBandwidthMonitoring();
    }
    
    startConnectionQualityMonitoring() {
        // Monitor connection changes
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                console.log('🌐 Network connection changed');
                this.updateNetworkMetrics();
                this.updateNetworkStatus();
                this.adaptToNetworkConditions();
            });
        }
        
        // Periodic connection quality check
        setInterval(() => {
            this.checkConnectionQuality();
        }, 30000); // Every 30 seconds
    }
    
    startBandwidthMonitoring() {
        // Simple bandwidth test using heartbeat response times
        this.bandwidthHistory = [];
        
        setInterval(() => {
            if (this.isOnline && this.performanceMetrics.loadTimes.length > 0) {
                const avgResponseTime = this.getAverageLoadTime();
                this.bandwidthHistory.push({
                    timestamp: Date.now(),
                    responseTime: avgResponseTime,
                    connectionType: this.networkMetrics.connectionType
                });
                
                // Keep only last 10 measurements
                if (this.bandwidthHistory.length > 10) {
                    this.bandwidthHistory.shift();
                }
                
                this.detectNetworkDegradation();
            }
        }, 60000); // Every minute
    }
    
    async checkConnectionQuality() {
        if (!this.isOnline) return;
        
        const startTime = Date.now();
        
        try {
            // Quick ping to health endpoint
            const response = await fetch(`${this.config.apiUrl}/health`, {
                method: 'HEAD',
                cache: 'no-cache'
            });
            
            const responseTime = Date.now() - startTime;
            
            if (response.ok) {
                this.recordConnectionQuality('good', responseTime);
            } else {
                this.recordConnectionQuality('poor', responseTime);
            }
        } catch (error) {
            this.recordConnectionQuality('failed', Date.now() - startTime);
        }
    }
    
    recordConnectionQuality(quality, responseTime) {
        if (!this.connectionQualityHistory) {
            this.connectionQualityHistory = [];
        }
        
        this.connectionQualityHistory.push({
            timestamp: Date.now(),
            quality: quality,
            responseTime: responseTime
        });
        
        // Keep only last 20 measurements
        if (this.connectionQualityHistory.length > 20) {
            this.connectionQualityHistory.shift();
        }
        
        console.log(`🌐 Connection quality: ${quality} (${responseTime}ms)`);
    }
    
    detectNetworkDegradation() {
        if (!this.bandwidthHistory || this.bandwidthHistory.length < 3) return;
        
        const recent = this.bandwidthHistory.slice(-3);
        const avgRecent = recent.reduce((sum, item) => sum + item.responseTime, 0) / recent.length;
        
        const older = this.bandwidthHistory.slice(0, -3);
        if (older.length === 0) return;
        
        const avgOlder = older.reduce((sum, item) => sum + item.responseTime, 0) / older.length;
        
        // If recent response times are significantly higher
        if (avgRecent > avgOlder * 1.5) {
            console.warn('🌐 Network degradation detected');
            this.adaptToNetworkConditions();
        }
    }
    
    adaptToNetworkConditions() {
        const connectionType = this.networkMetrics.connectionType;
        const avgResponseTime = this.getAverageLoadTime();
        
        // Adjust polling intervals based on network conditions
        if (connectionType === 'slow-2g' || avgResponseTime > 5000) {
            console.log('🌐 Adapting to slow network: reducing polling frequency');
            this.config.playlistCheckInterval = 120000; // 2 minutes
            this.config.heartbeatInterval = 60000; // 1 minute
        } else if (connectionType === '2g' || avgResponseTime > 2000) {
            console.log('🌐 Adapting to moderate network: standard polling');
            this.config.playlistCheckInterval = 90000; // 1.5 minutes
            this.config.heartbeatInterval = 45000; // 45 seconds
        } else {
            console.log('🌐 Good network: normal polling frequency');
            this.config.playlistCheckInterval = 60000; // 1 minute
            this.config.heartbeatInterval = 30000; // 30 seconds
        }
        
        // Restart intervals with new timing
        this.restartPollingIntervals();
    }
    
    restartPollingIntervals() {
        // Clear existing intervals
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.playlistCheckInterval) {
            clearInterval(this.playlistCheckInterval);
        }
        
        // Restart with new intervals
        this.startHeartbeat();
        this.startPlaylistCheck();
        
        console.log(`🔄 Polling intervals updated: heartbeat=${this.config.heartbeatInterval}ms, playlist=${this.config.playlistCheckInterval}ms`);
    }
    
    async reportError(errorMessage, details = {}) {
        if (!this.isOnline) return;
        
        try {
            await fetch(`${this.config.apiUrl}/api/player/${this.deviceCode}/error`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    error: errorMessage,
                    details: {
                        ...details,
                        timestamp: new Date().toISOString(),
                        userAgent: navigator.userAgent,
                        url: window.location.href,
                        cacheStats: this.getCacheStats()
                    }
                })
            });
            console.log('📊 Error reported to server');
        } catch (error) {
            console.error('Failed to report error:', error);
        }
    }
    
    getCacheStats() {
        try {
            const cacheSize = this.mediaCache.size;
            const preloadedSize = this.preloadedMedia.size;
            const storageUsed = JSON.stringify(localStorage).length;
            
            return {
                cachedItems: cacheSize,
                preloadedItems: preloadedSize,
                storageUsed: storageUsed,
                hasPlaylist: !!this.currentPlaylist,
                isPlaying: this.isPlaying
            };
        } catch (error) {
            return { error: 'Failed to get cache stats' };
        }
    }
    
    // Enhanced monitoring methods
    getPlaybackStats() {
        return {
            totalItemsPlayed: this.playbackStats.totalItemsPlayed,
            totalPlaytime: this.playbackStats.totalPlaytime,
            currentItemDuration: this.getCurrentItemDuration(),
            playlistLoops: Math.floor(this.playbackStats.totalItemsPlayed / (this.currentPlaylist?.items.length || 1)),
            averageItemDuration: this.playbackStats.totalItemsPlayed > 0 ? 
                this.playbackStats.totalPlaytime / this.playbackStats.totalItemsPlayed : 0
        };
    }
    
    getPerformanceMetrics() {
        const metrics = {
            memoryUsage: this.getMemoryUsage(),
            averageLoadTime: this.getAverageLoadTime(),
            recentLoadTimes: this.performanceMetrics.loadTimes.slice(-5),
            frameDrops: this.performanceMetrics.frameDrops
        };
        
        // Update network metrics
        this.updateNetworkMetrics();
        
        return metrics;
    }
    
    getNetworkStatus() {
        return {
            isOnline: this.isOnline,
            connectionType: this.networkMetrics.connectionType,
            downlink: this.networkMetrics.downlink,
            rtt: this.networkMetrics.rtt,
            lastHeartbeat: this.lastHeartbeatTime,
            retryCount: this.retryCount
        };
    }
    
    getCacheStatus() {
        return {
            mediaCache: this.mediaCache.size,
            preloadedMedia: this.preloadedMedia.size,
            storageUsed: this.getLocalStorageSize(),
            cacheHitRate: this.calculateCacheHitRate()
        };
    }
    
    getErrorCount() {
        return {
            total: this.playbackStats.errorCount,
            lastError: this.playbackStats.lastError,
            errorRate: this.playbackStats.totalItemsPlayed > 0 ? 
                this.playbackStats.errorCount / this.playbackStats.totalItemsPlayed : 0
        };
    }
    
    getUptime() {
        return Date.now() - this.startTime;
    }
    
    // Helper methods for monitoring
    getCurrentItemDuration() {
        if (!this.currentPlaylist || !this.currentPlaylist.items[this.currentItemIndex]) {
            return 0;
        }
        return this.currentPlaylist.items[this.currentItemIndex].duration;
    }
    
    getMemoryUsage() {
        if ('memory' in performance) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }
    
    getAverageLoadTime() {
        const loadTimes = this.performanceMetrics.loadTimes;
        if (loadTimes.length === 0) return 0;
        return loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
    }
    
    getConnectionType() {
        if ('connection' in navigator) {
            return navigator.connection.effectiveType || 'unknown';
        }
        return 'unknown';
    }
    
    getDownlink() {
        if ('connection' in navigator) {
            return navigator.connection.downlink || 0;
        }
        return 0;
    }
    
    getRTT() {
        if ('connection' in navigator) {
            return navigator.connection.rtt || 0;
        }
        return 0;
    }
    
    updateNetworkMetrics() {
        this.networkMetrics.connectionType = this.getConnectionType();
        this.networkMetrics.downlink = this.getDownlink();
        this.networkMetrics.rtt = this.getRTT();
    }
    
    getLocalStorageSize() {
        try {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
            return total;
        } catch (error) {
            return 0;
        }
    }
    
    calculateCacheHitRate() {
        // Simple cache hit rate calculation
        const totalRequests = this.playbackStats.totalItemsPlayed;
        const cacheHits = this.preloadedMedia.size;
        return totalRequests > 0 ? cacheHits / totalRequests : 0;
    }
    
    recordLoadTime(loadTime) {
        this.performanceMetrics.loadTimes.push(loadTime);
        // Keep only last 20 load times
        if (this.performanceMetrics.loadTimes.length > 20) {
            this.performanceMetrics.loadTimes.shift();
        }
    }
    
    recordError(error) {
        this.playbackStats.errorCount++;
        this.playbackStats.lastError = {
            message: error.message || error,
            timestamp: Date.now()
        };
    }
    
    recordItemPlayed(duration) {
        this.playbackStats.totalItemsPlayed++;
        this.playbackStats.totalPlaytime += duration;
    }
    
    async requestFullscreen() {
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
        } catch (error) {
            console.log('Fullscreen request failed:', error);
        }
    }
    
    async toggleFullscreen() {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.error('Fullscreen toggle failed:', error);
        }
    }
    
    async exitFullscreen() {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.error('Exit fullscreen failed:', error);
        }
    }
    
    // Cleanup method
    destroy() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.playlistCheckInterval) {
            clearInterval(this.playlistCheckInterval);
        }
        this.clearItemTimeout();
        this.clearProgressInterval();
        this.clearPlaylistRefreshTimeout();
        this.stopPlayback();
        
        console.log('🧹 Player cleanup completed');
    }
}

// Initialize player when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.player = new DigitalSignagePlayer();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.player) {
        window.player.destroy();
    }
});