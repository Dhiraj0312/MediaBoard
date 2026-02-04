# Digital Signage Web Player

A web-based player application for displaying digital signage content on screens.

## Features

- **Device Code Authentication**: Pairs with the admin system using a unique device code
- **Fullscreen Playback**: Automatically enters fullscreen mode for optimal display
- **Media Support**: Displays images (JPEG, PNG, GIF) and videos (MP4, WebM)
- **Offline Caching**: Caches content for offline playback
- **Real-time Updates**: Polls for playlist changes and updates content automatically
- **Heartbeat Monitoring**: Sends status updates to the admin system
- **Error Recovery**: Graceful handling of network issues and media errors

## Usage

### Accessing the Player

The player is served by the backend server at:
```
http://localhost:3001/player
```

### Device Pairing

1. Open the player URL in a web browser on your display device
2. Note the 8-character device code displayed on screen
3. In the admin portal, add a new screen using this device code
4. Assign a playlist to the screen
5. The player will automatically start displaying content

### Keyboard Shortcuts

- **F**: Toggle fullscreen mode
- **R**: Refresh and check for new content
- **Escape**: Exit fullscreen mode

### Configuration

The player automatically detects the API server URL based on the current location. For custom configurations, modify the `getApiUrl()` method in `player.js`.

## Technical Details

### API Endpoints Used

- `GET /api/player/{deviceCode}`: Fetch assigned playlist content
- `POST /api/player/{deviceCode}/heartbeat`: Send status updates
- `GET /api/player/{deviceCode}/status`: Get current screen status

### Caching Strategy

- Media files are preloaded when a playlist is assigned
- Content is cached in browser storage for offline playback
- Cache expires after 24 hours

### Network Handling

- Polls for playlist updates every 60 seconds
- Sends heartbeat every 30 seconds
- Automatically retries failed requests with exponential backoff
- Gracefully handles offline mode

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Deployment

The player is automatically served by the backend server. No separate deployment is required.

For production use:
1. Ensure the backend server is accessible from display devices
2. Configure appropriate CORS settings
3. Use HTTPS for secure communication
4. Consider using a dedicated display browser or kiosk mode