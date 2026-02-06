'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { apiClient } from '@/lib/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [apiToken, setApiToken] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [backendError, setBackendError] = useState(null);
  const supabase = createClient();

  // Token storage helper methods
  const storeAPIToken = (token) => {
    if (typeof window === 'undefined') return;
    
    const timestamp = new Date().toISOString();
    const expiry = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(); // 8 hours from now
    
    localStorage.setItem('api_token', token);
    localStorage.setItem('token_timestamp', timestamp);
    localStorage.setItem('token_expiry', expiry);
    
    setApiToken(token);
    
    console.log('[AuthContext] API token stored', {
      timestamp,
      expiry,
      userId: user?.id || 'unknown'
    });
  };

  const getStoredAPIToken = () => {
    if (typeof window === 'undefined') return null;
    
    const token = localStorage.getItem('api_token');
    const timestamp = localStorage.getItem('token_timestamp');
    const expiry = localStorage.getItem('token_expiry');
    
    console.log('[AuthContext] Retrieved stored token', {
      hasToken: !!token,
      timestamp,
      expiry,
      userId: user?.id || 'unknown'
    });
    
    return { token, timestamp, expiry };
  };

  const isTokenValid = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('api_token');
    const expiry = localStorage.getItem('token_expiry');
    
    if (!token || !expiry) {
      console.log('[AuthContext] Token validation failed: missing token or expiry');
      return false;
    }
    
    const expiryDate = new Date(expiry);
    const now = new Date();
    const isValid = expiryDate > now;
    
    console.log('[AuthContext] Token validation', {
      isValid,
      expiryDate: expiryDate.toISOString(),
      now: now.toISOString(),
      userId: user?.id || 'unknown'
    });
    
    return isValid;
  }, [user?.id]);

  const clearStoredToken = () => {
    if (typeof window === 'undefined') return;
    
    console.log('[AuthContext] Clearing stored token', {
      userId: user?.id || 'unknown',
      timestamp: new Date().toISOString()
    });
    
    localStorage.removeItem('api_token');
    localStorage.removeItem('token_timestamp');
    localStorage.removeItem('token_expiry');
    
    setApiToken(null);
  };

  const ensureAPIToken = useCallback(async () => {
    console.log('[AuthContext] Ensuring API token is valid', {
      timestamp: new Date().toISOString(),
      userId: user?.id || 'unknown'
    });

    // Check if token exists and is valid - call directly without dependency
    const tokenValid = (() => {
      if (typeof window === 'undefined') return false;
      const token = localStorage.getItem('api_token');
      const expiry = localStorage.getItem('token_expiry');
      if (!token || !expiry) return false;
      return new Date(expiry) > new Date();
    })();

    if (tokenValid) {
      console.log('[AuthContext] API token is valid');
      return true;
    }

    console.log('[AuthContext] API token is invalid or expired');

    // Token is expired or missing, check if we have a valid Supabase session
    if (session?.access_token) {
      console.log('[AuthContext] Attempting to refresh API token using Supabase session');
      
      try {
        await authenticateWithAPI(session.access_token);
        
        // Check if token is now valid
        const newTokenValid = (() => {
          if (typeof window === 'undefined') return false;
          const token = localStorage.getItem('api_token');
          const expiry = localStorage.getItem('token_expiry');
          if (!token || !expiry) return false;
          return new Date(expiry) > new Date();
        })();

        if (newTokenValid) {
          console.log('[AuthContext] API token refresh successful');
          return true;
        } else {
          console.error('[AuthContext] API token refresh failed: token still invalid');
          clearStoredToken();
          return false;
        }
      } catch (error) {
        console.error('[AuthContext] Error refreshing API token:', {
          error: error.message,
          timestamp: new Date().toISOString()
        });
        clearStoredToken();
        return false;
      }
    } else {
      console.log('[AuthContext] No valid Supabase session for token refresh');
      clearStoredToken();
      return false;
    }
  }, [session, user?.id]);

  const checkBackendHealth = useCallback(async (retryOnFailure = true) => {
    console.log('[AuthContext] Checking backend health', {
      timestamp: new Date().toISOString()
    });

    try {
      const response = await apiClient.healthCheck();
      
      console.log('[AuthContext] Backend health check successful', {
        status: response.status,
        timestamp: new Date().toISOString()
      });
      
      setBackendAvailable(true);
      setBackendError(null);
      return true;
    } catch (error) {
      console.error('[AuthContext] Backend health check failed', {
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
      
      setBackendAvailable(false);
      setBackendError(error.message);

      // Retry once after a short delay
      if (retryOnFailure) {
        console.log('[AuthContext] Retrying backend health check in 2 seconds');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return checkBackendHealth(false); // Don't retry again
      }
      
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let healthCheckInterval = null;

    // Set auth context on apiClient
    apiClient.setAuthContext({
      get session() {
        return session;
      },
      ensureAPIToken
    });

    // Get initial session
    const getInitialSession = async () => {
      try {
        // Check backend health in background (non-blocking)
        checkBackendHealth().catch(err => {
          console.error('[AuthContext] Background health check failed:', err);
        });

        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Load stored token
          const { token } = getStoredAPIToken();
          if (token) {
            setApiToken(token);
          }
          
          // If we have a session, authenticate with our API
          if (session?.access_token) {
            console.log('[AuthContext] Initial session found, authenticating with API', {
              timestamp: new Date().toISOString(),
              userId: session.user?.id
            });
            await authenticateWithAPI(session.access_token);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error getting initial session:', {
          error: error.message,
          timestamp: new Date().toISOString()
        });
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    getInitialSession();

    // Set up periodic health check polling (every 30 seconds)
    healthCheckInterval = setInterval(async () => {
      if (!mounted) return;
      
      console.log('[AuthContext] Periodic backend health check');
      const isHealthy = await checkBackendHealth(false);
      
      if (isHealthy && !backendAvailable) {
        console.log('[AuthContext] Backend reconnected, re-enabling features');
      }
    }, 30000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('[AuthContext] Auth state changed:', {
          event,
          email: session?.user?.email,
          timestamp: new Date().toISOString()
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[AuthContext] User signed in', {
            userId: session.user.id,
            email: session.user.email,
            timestamp: new Date().toISOString()
          });
          await createUserProfile(session.user);
          await authenticateWithAPI(session.access_token);
        } else if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] User signed out', {
            timestamp: new Date().toISOString()
          });
          // Clear API token on sign out
          clearStoredToken();
        } else if (event === 'TOKEN_REFRESHED' && session?.access_token) {
          console.log('[AuthContext] Supabase token refreshed, exchanging for new API token', {
            userId: session.user?.id,
            timestamp: new Date().toISOString()
          });
          // Exchange new Supabase token for API token
          await authenticateWithAPI(session.access_token);
        } else if (event === 'USER_UPDATED' && session?.access_token) {
          console.log('[AuthContext] User updated', {
            userId: session.user?.id,
            timestamp: new Date().toISOString()
          });
          // Ensure we have a valid API token
          if (!isTokenValid()) {
            console.log('[AuthContext] API token invalid after user update, refreshing');
            await authenticateWithAPI(session.access_token);
          }
        }
      }
    );

    return () => {
      mounted = false;
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
      }
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const authenticateWithAPI = async (supabaseToken) => {
    try {
      console.log('[AuthContext] Starting API token exchange', {
        timestamp: new Date().toISOString(),
        userId: user?.id || session?.user?.id || 'unknown'
      });
      
      const response = await apiClient.login(supabaseToken);
      
      if (response.token) {
        storeAPIToken(response.token);
        console.log('[AuthContext] API token exchange successful', {
          timestamp: new Date().toISOString(),
          userId: user?.id || session?.user?.id || 'unknown'
        });
      } else {
        console.error('[AuthContext] API token exchange failed: no token in response', {
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('[AuthContext] Error authenticating with API:', {
        error: error.message,
        timestamp: new Date().toISOString(),
        userId: user?.id || session?.user?.id || 'unknown'
      });
      // Don't throw here, as Supabase auth might still be valid
    }
  };

  const createUserProfile = async (user) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || '',
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating user profile:', error);
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      
      console.log('[AuthContext] Sign in attempt', {
        email,
        timestamp: new Date().toISOString()
      });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Supabase sign in failed', {
          error: error.message,
          email,
          timestamp: new Date().toISOString()
        });
        return { error };
      }

      console.log('[AuthContext] Supabase sign in successful', {
        userId: data.user?.id,
        email: data.user?.email,
        timestamp: new Date().toISOString()
      });

      // Authenticate with API after successful Supabase login
      if (data.session?.access_token) {
        await authenticateWithAPI(data.session.access_token);
      }

      return { data, error: null };
    } catch (error) {
      console.error('[AuthContext] Error in signIn:', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      return { data, error };
    } catch (error) {
      console.error('Error in signUp:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      console.log('[AuthContext] Sign out attempt', {
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
      
      // Logout from API first
      try {
        await apiClient.logout();
        console.log('[AuthContext] API logout successful', {
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('[AuthContext] Error logging out from API:', {
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
      
      // Always sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthContext] Error signing out from Supabase:', {
          error: error.message,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('[AuthContext] Supabase sign out successful', {
          timestamp: new Date().toISOString()
        });
      }
      
      // Clear local state
      setUser(null);
      setSession(null);
      clearStoredToken();
      
    } catch (error) {
      console.error('[AuthContext] Error in signOut:', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    initialized,
    apiToken,
    backendAvailable,
    backendError,
    signIn,
    signOut,
    signUp,
    isAuthenticated: !!user,
    ensureAPIToken,
    isTokenValid,
    clearStoredToken,
    checkBackendHealth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}