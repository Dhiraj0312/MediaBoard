// Content Management Utility for Digital Signage Player
class ContentManager {
    constructor() {
        this.storageQuota = null;
        this.storageUsage = null;
        this.init();
    }
    
    async init() {
        // Get storage quota information if available
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                this.storageQuota = estimate.quota;
                this.storageUsage = estimate.usage;
                console.log(`💾 Storage: ${this.formatBytes(this.storageUsage)} / ${this.formatBytes(this.storageQuota)}`);
            } catch (error) {
                console.warn('Could not get storage estimate:', error);
            }
        }
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Check if we have enough storage space
    async checkStorageSpace(requiredBytes = 0) {
        if (!this.storageQuota) return true; // Can't check, assume OK
        
        try {
            const estimate = await navigator.storage.estimate();
            const available = estimate.quota - estimate.usage;
            return available > requiredBytes;
        } catch (error) {
            return true; // Can't check, assume OK
        }
    }
    
    // Get localStorage usage
    getLocalStorageUsage() {
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
    
    // Clean up old cache entries
    cleanupCache() {
        try {
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            // Clean media cache
            const mediaCache = localStorage.getItem('mediaCache');
            if (mediaCache) {
                const cacheData = JSON.parse(mediaCache);
                if (now - cacheData.timestamp > maxAge) {
                    localStorage.removeItem('mediaCache');
                    console.log('🧹 Cleaned expired media cache');
                }
            }
            
            // Clean playlist cache
            const playlistCache = localStorage.getItem('cachedPlaylist');
            if (playlistCache) {
                const playlistData = JSON.parse(playlistCache);
                if (now - playlistData.timestamp > maxAge) {
                    localStorage.removeItem('cachedPlaylist');
                    console.log('🧹 Cleaned expired playlist cache');
                }
            }
            
            return true;
        } catch (error) {
            console.error('Cache cleanup failed:', error);
            return false;
        }
    }
    
    // Get cache statistics
    getCacheInfo() {
        try {
            const mediaCache = localStorage.getItem('mediaCache');
            const playlistCache = localStorage.getItem('cachedPlaylist');
            const deviceCode = localStorage.getItem('deviceCode');
            
            const info = {
                hasMediaCache: !!mediaCache,
                hasPlaylistCache: !!playlistCache,
                hasDeviceCode: !!deviceCode,
                localStorageUsage: this.getLocalStorageUsage(),
                totalItems: 0,
                cacheAge: null
            };
            
            if (mediaCache) {
                const cacheData = JSON.parse(mediaCache);
                info.totalItems = cacheData.data ? cacheData.data.length : 0;
                info.cacheAge = Date.now() - cacheData.timestamp;
            }
            
            return info;
        } catch (error) {
            return { error: error.message };
        }
    }
    
    // Export cache data for debugging
    exportCacheData() {
        try {
            const data = {
                mediaCache: localStorage.getItem('mediaCache'),
                playlistCache: localStorage.getItem('cachedPlaylist'),
                deviceCode: localStorage.getItem('deviceCode'),
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                storageInfo: {
                    quota: this.storageQuota,
                    usage: this.storageUsage,
                    localStorageUsage: this.getLocalStorageUsage()
                }
            };
            
            return JSON.stringify(data, null, 2);
        } catch (error) {
            return `Error exporting cache data: ${error.message}`;
        }
    }
    
    // Import cache data (for debugging/testing)
    importCacheData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.mediaCache) {
                localStorage.setItem('mediaCache', data.mediaCache);
            }
            if (data.playlistCache) {
                localStorage.setItem('cachedPlaylist', data.playlistCache);
            }
            if (data.deviceCode) {
                localStorage.setItem('deviceCode', data.deviceCode);
            }
            
            console.log('✅ Cache data imported successfully');
            return true;
        } catch (error) {
            console.error('Failed to import cache data:', error);
            return false;
        }
    }
    
    // Reset all cache and storage
    resetAll() {
        try {
            localStorage.clear();
            console.log('🧹 All cache and storage cleared');
            return true;
        } catch (error) {
            console.error('Failed to reset storage:', error);
            return false;
        }
    }
}

// Make ContentManager available globally for debugging
window.ContentManager = ContentManager;

// Auto-initialize if not in a module environment
if (typeof module === 'undefined') {
    window.contentManager = new ContentManager();
}