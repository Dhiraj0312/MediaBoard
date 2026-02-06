# Requirements Document

## Introduction

This document outlines the requirements for fixing authentication token synchronization issues in the Digital Signage Platform. The system currently experiences 401 Unauthorized errors on dashboard API calls and backend connection failures, preventing authenticated users from accessing protected resources.

## Glossary

- **API_Token**: JWT token issued by the backend API for authenticating requests
- **Supabase_Token**: Access token issued by Supabase Auth after user login
- **Token_Sync**: The process of exchanging Supabase tokens for API tokens
- **Auth_Flow**: The complete authentication sequence from login to API access
- **Protected_Endpoint**: API endpoints requiring valid authentication tokens
- **Token_Storage**: Browser localStorage mechanism for persisting API tokens
- **Backend_Server**: Express.js API server running on port 3001
- **Dashboard_Polling**: Periodic API requests to fetch dashboard data

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want my authentication token to be properly synchronized between Supabase and the backend API, so that I can access protected dashboard endpoints without 401 errors.

#### Acceptance Criteria

1. WHEN a user successfully logs in with Supabase, THE system SHALL exchange the Supabase_Token for an API_Token
2. THE system SHALL store the API_Token in Token_Storage immediately after receiving it
3. WHEN the API_Token is stored, THE system SHALL include it in all subsequent API requests
4. THE system SHALL verify the API_Token is present before making requests to Protected_Endpoints
5. WHEN the API_Token is missing or invalid, THE system SHALL attempt to re-authenticate using the Supabase_Token

### Requirement 2

**User Story:** As a system administrator, I want the backend server to start reliably and remain accessible, so that the frontend can communicate with API endpoints without connection errors.

#### Acceptance Criteria

1. THE Backend_Server SHALL start successfully on port 3001 when the development command is executed
2. THE Backend_Server SHALL respond to health check requests at /health endpoint
3. WHEN the Backend_Server is not running, THE system SHALL display a clear error message to the user
4. THE system SHALL provide instructions for starting the Backend_Server when connection fails
5. THE Backend_Server SHALL log startup status and available endpoints to the console

### Requirement 3

**User Story:** As a system administrator, I want the authentication context to handle token refresh and expiration gracefully, so that my session remains valid during extended usage.

#### Acceptance Criteria

1. THE AuthContext SHALL monitor Supabase session state changes continuously
2. WHEN the Supabase session expires, THE system SHALL clear the API_Token from Token_Storage
3. WHEN the Supabase session is refreshed, THE system SHALL obtain a new API_Token
4. THE system SHALL handle token refresh without requiring user re-login
5. THE system SHALL redirect to login page only when both Supabase and API tokens are invalid

### Requirement 4

**User Story:** As a system administrator, I want API requests to fail gracefully with helpful error messages, so that I can understand and resolve authentication issues quickly.

#### Acceptance Criteria

1. WHEN an API request returns 401 Unauthorized, THE system SHALL log the specific endpoint and error details
2. THE system SHALL distinguish between missing tokens and invalid tokens in error messages
3. WHEN authentication fails, THE system SHALL provide actionable guidance to the user
4. THE system SHALL prevent infinite retry loops when authentication continuously fails
5. THE system SHALL display user-friendly error messages in the UI for authentication failures

### Requirement 5

**User Story:** As a developer, I want comprehensive logging of the authentication flow, so that I can diagnose token synchronization issues during development.

#### Acceptance Criteria

1. THE system SHALL log when Supabase authentication succeeds or fails
2. THE system SHALL log when API token exchange occurs
3. THE system SHALL log when API tokens are stored or retrieved from Token_Storage
4. THE system SHALL log authentication errors with sufficient context for debugging
5. THE system SHALL include timestamps and user identifiers in authentication logs

### Requirement 6

**User Story:** As a system administrator, I want the dashboard to load successfully after login, so that I can view system statistics and monitor screens without errors.

#### Acceptance Criteria

1. WHEN a user navigates to the dashboard after login, THE system SHALL have a valid API_Token
2. THE Dashboard_Polling SHALL include the API_Token in Authorization headers
3. WHEN dashboard API calls succeed, THE system SHALL display the fetched data
4. THE system SHALL handle dashboard API failures without crashing the application
5. THE system SHALL retry failed dashboard requests with exponential backoff

### Requirement 7

**User Story:** As a system administrator, I want the system to validate backend connectivity before attempting authenticated requests, so that I receive clear feedback about connection issues.

#### Acceptance Criteria

1. THE system SHALL check Backend_Server availability on application initialization
2. WHEN the Backend_Server is unreachable, THE system SHALL display a connection error banner
3. THE system SHALL provide a retry mechanism for establishing backend connection
4. THE system SHALL disable API-dependent features when backend is unavailable
5. THE system SHALL automatically re-enable features when backend connection is restored

### Requirement 8

**User Story:** As a developer, I want the authentication middleware to accept both Supabase tokens and API tokens, so that the transition between authentication systems is seamless.

#### Acceptance Criteria

1. THE authentication middleware SHALL attempt to verify API_Token first
2. WHEN API_Token verification fails, THE middleware SHALL attempt Supabase_Token verification
3. THE middleware SHALL return consistent user objects regardless of token type
4. THE middleware SHALL log which token type was successfully verified
5. THE middleware SHALL reject requests only when both token types are invalid
