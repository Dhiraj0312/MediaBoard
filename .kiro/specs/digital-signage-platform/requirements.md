# Requirements Document

## Introduction

This document outlines the requirements for building a production-ready digital signage management system that replicates DotSignage functionality using only JavaScript and free-tier services. The system will provide secure admin login, cloud-based media and playlist management, real-time screen synchronization, and a web-based player for digital signage displays.

## Glossary

- **Digital_Signage_System**: The complete web-based platform for managing digital signage content and displays
- **Admin_Portal**: The web interface for administrators to manage screens, media, and playlists
- **Web_Player**: The browser-based application that displays content on digital signage screens
- **Screen**: A physical display device that shows digital signage content
- **Media_Item**: Digital content (image or video) that can be displayed on screens
- **Playlist**: An ordered collection of media items with specified durations
- **Device_Code**: A unique identifier used to pair screens with the system without authentication
- **Heartbeat**: Regular status updates sent by screens to indicate they are online
- **Supabase_Auth**: The authentication service provided by Supabase
- **RLS**: Row Level Security policies in the database

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want to securely log into the admin portal using email and password, so that I can manage digital signage content and displays.

#### Acceptance Criteria

1. WHEN an administrator enters valid credentials, THE Digital_Signage_System SHALL authenticate the user through Supabase_Auth
2. THE Digital_Signage_System SHALL create an admin profile automatically on first login
3. WHEN authentication fails, THE Digital_Signage_System SHALL display an error message and prevent access
4. THE Digital_Signage_System SHALL redirect authenticated users to the dashboard
5. THE Digital_Signage_System SHALL provide a logout function that clears the session

### Requirement 2

**User Story:** As a system administrator, I want to manage screens and monitor their online/offline status, so that I can ensure all displays are functioning properly.

#### Acceptance Criteria

1. THE Digital_Signage_System SHALL display a list of all registered screens with their current status
2. WHEN a Screen sends a heartbeat, THE Digital_Signage_System SHALL update the screen status to online
3. WHEN a Screen fails to send heartbeat for 60 seconds, THE Digital_Signage_System SHALL mark the screen as offline
4. THE Digital_Signage_System SHALL allow administrators to add new screens with unique device codes
5. THE Digital_Signage_System SHALL allow administrators to remove screens from the system

### Requirement 3

**User Story:** As a system administrator, I want to upload and manage media files, so that I can create content for digital signage displays.

#### Acceptance Criteria

1. THE Digital_Signage_System SHALL allow upload of image files (JPEG, PNG, GIF) to Supabase Storage
2. THE Digital_Signage_System SHALL allow upload of video files (MP4, WebM) to Supabase Storage
3. THE Digital_Signage_System SHALL provide preview functionality for uploaded media
4. THE Digital_Signage_System SHALL store media metadata in the database with file URLs
5. THE Digital_Signage_System SHALL allow administrators to delete media files and update database records

### Requirement 4

**User Story:** As a system administrator, I want to create and manage playlists with drag-and-drop functionality, so that I can organize content sequences for different screens.

#### Acceptance Criteria

1. THE Digital_Signage_System SHALL provide a playlist builder interface with drag-and-drop functionality
2. THE Digital_Signage_System SHALL allow administrators to add Media_Items to playlists with specified durations
3. THE Digital_Signage_System SHALL allow administrators to reorder items within playlists
4. THE Digital_Signage_System SHALL save playlist configurations to the database
5. THE Digital_Signage_System SHALL allow administrators to delete playlists and update screen assignments

### Requirement 5

**User Story:** As a system administrator, I want to assign playlists to screens, so that I can control what content displays on each digital signage device.

#### Acceptance Criteria

1. THE Digital_Signage_System SHALL provide an interface to assign playlists to specific screens
2. THE Digital_Signage_System SHALL allow one playlist to be assigned to multiple screens
3. THE Digital_Signage_System SHALL update screen assignments in real-time through polling
4. THE Digital_Signage_System SHALL store screen-playlist relationships in the database
5. THE Digital_Signage_System SHALL allow administrators to change playlist assignments

### Requirement 6

**User Story:** As a digital signage screen, I want to display assigned playlist content in fullscreen mode, so that viewers can see the intended digital signage content.

#### Acceptance Criteria

1. THE Web_Player SHALL authenticate using Device_Code without requiring user login
2. THE Web_Player SHALL fetch assigned playlist data through API calls
3. THE Web_Player SHALL display media items in fullscreen mode with specified durations
4. THE Web_Player SHALL loop through playlist items continuously
5. THE Web_Player SHALL cache media files in browser storage for offline playback

### Requirement 7

**User Story:** As a digital signage screen, I want to maintain connection with the management system, so that administrators can monitor my status and update my content.

#### Acceptance Criteria

1. THE Web_Player SHALL send heartbeat signals to the server every 30 seconds
2. THE Web_Player SHALL poll for playlist updates every 60 seconds
3. WHEN playlist content changes, THE Web_Player SHALL download new media files
4. THE Web_Player SHALL handle network disconnections gracefully
5. THE Web_Player SHALL resume normal operation when network connectivity is restored

### Requirement 8

**User Story:** As a system administrator, I want to access the system through a professional enterprise interface, so that I can efficiently manage digital signage operations.

#### Acceptance Criteria

1. THE Admin_Portal SHALL provide a sidebar navigation layout
2. THE Admin_Portal SHALL include pages for dashboard, screens, media, playlists, and assignments
3. THE Admin_Portal SHALL use clean, professional styling consistent with enterprise SaaS applications
4. THE Admin_Portal SHALL provide responsive design for different screen sizes
5. THE Admin_Portal SHALL include modals and drawers for detailed operations

### Requirement 9

**User Story:** As a system administrator, I want all data to be securely stored and accessed, so that unauthorized users cannot access or modify digital signage content.

#### Acceptance Criteria

1. THE Digital_Signage_System SHALL implement Row Level Security policies in the database
2. THE Digital_Signage_System SHALL protect all API endpoints with JWT authentication
3. THE Digital_Signage_System SHALL validate user permissions before allowing data access
4. THE Digital_Signage_System SHALL use HTTPS for all client-server communications
5. THE Digital_Signage_System SHALL store media files with appropriate access controls

### Requirement 10

**User Story:** As a system operator, I want to deploy the system using only free-tier services, so that operational costs remain minimal while maintaining production readiness.

#### Acceptance Criteria

1. THE Digital_Signage_System SHALL use Supabase free tier for authentication, database, and storage
2. THE Digital_Signage_System SHALL deploy the frontend on Vercel free tier
3. THE Digital_Signage_System SHALL deploy the backend on Render, Railway, or Cyclic free tier
4. THE Digital_Signage_System SHALL operate within free-tier limitations and quotas
5. THE Digital_Signage_System SHALL provide clear upgrade paths for scaling beyond free tiers