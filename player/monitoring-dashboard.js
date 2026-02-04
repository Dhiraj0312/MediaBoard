// Player Monitoring Dashboard
class PlayerMonitoringDashboard {
    constructor(player) {
        this.player = player;
        this.isVisible = false;
        this.updateInterval = null;
        this.init();
    }
    
    init() {
        this.createDashboard();
        this.setupEventListeners();
    }
    
    createDashboard() {
        // Create dashboard container
        this.dashboard = document.createElement('div');
        this.dashboard.id = 'monitoring-dashboard';
        this.dashboard.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 20px;
            box-sizing: border-box;
            overflow-y: auto;
            z-index: 10000;
            display: none;
        `;
        
        document.body.appendChild(this.dashboard);
    }
    
    setupEventListeners() {
        // Toggle dashboard with Ctrl+M
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'm') {
                e.preventDefault();
                this.toggle();
            }
            
            // Close dashboard with Escape
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    show() {
        this.isVisible = true;
        this.dashboard.style.display = 'block';
        this.startUpdating();
    }
    
    hide() {
        this.isVisible = false;
        this.dashboard.style.display = 'none';
        this.stopUpdating();
    }
    
    startUpdating() {
        this.update();
        this.updateInterval = setInterval(() => {
            this.update();
        }, 1000); // Update every second
    }
    
    stopUpdating() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    update() {
        if (!this.isVisible) return;
        
        const data = this.collectMonitoringData();
        this.dashboard.innerHTML = this.renderDashboard(data);
    }
    
    collectMonitoringData() {
        return {
            system: {
                uptime: this.formatUptime(this.player.getUptime()),
                deviceCode: this.player.deviceCode,
                apiUrl: this.player.config.apiUrl,
                isOnline: this.player.isOnline,
                isPlaying: this.player.isPlaying,
                isFullscreen: this.player.isFullscreen
            },
            playlist: {
                current: this.player.currentPlaylist?.name || 'None',
                itemCount: this.player.currentPlaylist?.items.length || 0,
                currentItem: this.player.currentItemIndex + 1,
                totalDuration: this.getTotalPlaylistDuration()
            },
            performance: this.player.getPerformanceMetrics(),
            network: this.player.getNetworkStatus(),
            cache: this.player.getCacheStatus(),
            playback: this.player.getPlaybackStats(),
            errors: this.player.getErrorCount()
        };
    }
    
    renderDashboard(data) {
        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; height: 100%;">
                <div>
                    <h2 style="color: #4A90E2; margin-bottom: 15px;">🎮 PLAYER STATUS</h2>
                    ${this.renderSystemInfo(data.system)}
                    
                    <h3 style="color: #4A90E2; margin: 20px 0 10px 0;">📋 PLAYLIST</h3>
                    ${this.renderPlaylistInfo(data.playlist)}
                    
                    <h3 style="color: #4A90E2; margin: 20px 0 10px 0;">📊 PERFORMANCE</h3>
                    ${this.renderPerformanceInfo(data.performance)}
                </div>
                
                <div>
                    <h2 style="color: #4A90E2; margin-bottom: 15px;">🌐 NETWORK & CACHE</h2>
                    ${this.renderNetworkInfo(data.network)}
                    
                    <h3 style="color: #4A90E2; margin: 20px 0 10px 0;">💾 CACHE STATUS</h3>
                    ${this.renderCacheInfo(data.cache)}
                    
                    <h3 style="color: #4A90E2; margin: 20px 0 10px 0;">🎬 PLAYBACK STATS</h3>
                    ${this.renderPlaybackInfo(data.playback)}
                    
                    <h3 style="color: #4A90E2; margin: 20px 0 10px 0;">⚠️ ERRORS</h3>
                    ${this.renderErrorInfo(data.errors)}
                </div>
            </div>
            
            <div style="position: fixed; bottom: 20px; right: 20px; color: #888;">
                Press Ctrl+M to toggle • ESC to close
            </div>
        `;
    }
    
    renderSystemInfo(system) {
        return `
            <div style="background: #1a1a1a; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                <div>Device Code: <span style="color: #4A90E2;">${system.deviceCode}</span></div>
                <div>Uptime: <span style="color: #28a745;">${system.uptime}</span></div>
                <div>API URL: <span style="color: #ffc107;">${system.apiUrl}</span></div>
                <div>Status: ${this.getStatusBadge(system.isOnline, system.isPlaying)}</div>
                <div>Fullscreen: ${system.isFullscreen ? '✅' : '❌'}</div>
            </div>
        `;
    }
    
    renderPlaylistInfo(playlist) {
        return `
            <div style="background: #1a1a1a; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                <div>Current: <span style="color: #4A90E2;">${playlist.current}</span></div>
                <div>Items: <span style="color: #28a745;">${playlist.itemCount}</span></div>
                <div>Playing: <span style="color: #ffc107;">${playlist.currentItem}/${playlist.itemCount}</span></div>
                <div>Duration: <span style="color: #17a2b8;">${playlist.totalDuration}s</span></div>
            </div>
        `;
    }
    
    renderPerformanceInfo(performance) {
        const memory = performance.memoryUsage;
        return `
            <div style="background: #1a1a1a; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                <div>Avg Load Time: <span style="color: #28a745;">${performance.averageLoadTime.toFixed(0)}ms</span></div>
                <div>Recent Loads: <span style="color: #17a2b8;">[${performance.recentLoadTimes.map(t => t.toFixed(0)).join(', ')}]</span></div>
                ${memory ? `
                    <div>Memory Used: <span style="color: #ffc107;">${this.formatBytes(memory.used)}</span></div>
                    <div>Memory Total: <span style="color: #6c757d;">${this.formatBytes(memory.total)}</span></div>
                ` : '<div>Memory: <span style="color: #6c757d;">Not available</span></div>'}
            </div>
        `;
    }
    
    renderNetworkInfo(network) {
        return `
            <div style="background: #1a1a1a; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                <div>Online: ${network.isOnline ? '🟢' : '🔴'}</div>
                <div>Connection: <span style="color: #4A90E2;">${network.connectionType}</span></div>
                <div>Downlink: <span style="color: #28a745;">${network.downlink} Mbps</span></div>
                <div>RTT: <span style="color: #ffc107;">${network.rtt}ms</span></div>
                <div>Retry Count: <span style="color: ${network.retryCount > 0 ? '#dc3545' : '#28a745'};">${network.retryCount}</span></div>
                <div>Last Heartbeat: <span style="color: #17a2b8;">${this.formatTimestamp(network.lastHeartbeat)}</span></div>
            </div>
        `;
    }
    
    renderCacheInfo(cache) {
        return `
            <div style="background: #1a1a1a; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                <div>Media Cache: <span style="color: #4A90E2;">${cache.mediaCache} items</span></div>
                <div>Preloaded: <span style="color: #28a745;">${cache.preloadedMedia} items</span></div>
                <div>Storage Used: <span style="color: #ffc107;">${this.formatBytes(cache.storageUsed)}</span></div>
                <div>Hit Rate: <span style="color: #17a2b8;">${(cache.cacheHitRate * 100).toFixed(1)}%</span></div>
            </div>
        `;
    }
    
    renderPlaybackInfo(playback) {
        return `
            <div style="background: #1a1a1a; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                <div>Items Played: <span style="color: #4A90E2;">${playback.totalItemsPlayed}</span></div>
                <div>Total Playtime: <span style="color: #28a745;">${this.formatDuration(playback.totalPlaytime)}</span></div>
                <div>Playlist Loops: <span style="color: #ffc107;">${playback.playlistLoops}</span></div>
                <div>Avg Item Duration: <span style="color: #17a2b8;">${playback.averageItemDuration.toFixed(1)}s</span></div>
            </div>
        `;
    }
    
    renderErrorInfo(errors) {
        return `
            <div style="background: #1a1a1a; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                <div>Total Errors: <span style="color: ${errors.total > 0 ? '#dc3545' : '#28a745'};">${errors.total}</span></div>
                <div>Error Rate: <span style="color: ${errors.errorRate > 0.1 ? '#dc3545' : '#28a745'};">${(errors.errorRate * 100).toFixed(1)}%</span></div>
                ${errors.lastError ? `
                    <div>Last Error: <span style="color: #dc3545;">${errors.lastError.message}</span></div>
                    <div>Error Time: <span style="color: #6c757d;">${this.formatTimestamp(errors.lastError.timestamp)}</span></div>
                ` : '<div>Last Error: <span style="color: #28a745;">None</span></div>'}
            </div>
        `;
    }
    
    getStatusBadge(isOnline, isPlaying) {
        if (!isOnline) return '<span style="color: #dc3545;">🔴 Offline</span>';
        if (isPlaying) return '<span style="color: #28a745;">🟢 Playing</span>';
        return '<span style="color: #ffc107;">🟡 Online</span>';
    }
    
    getTotalPlaylistDuration() {
        if (!this.player.currentPlaylist) return 0;
        return this.player.currentPlaylist.items.reduce((sum, item) => sum + item.duration, 0);
    }
    
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }
    
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    formatTimestamp(timestamp) {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    }
}

// Auto-initialize if player is available
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.player) {
            window.monitoringDashboard = new PlayerMonitoringDashboard(window.player);
        } else {
            // Wait for player to be initialized
            setTimeout(() => {
                if (window.player) {
                    window.monitoringDashboard = new PlayerMonitoringDashboard(window.player);
                }
            }, 1000);
        }
    });
}