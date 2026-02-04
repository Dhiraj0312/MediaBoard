'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { apiClient } from '@/lib/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // If we have a session, authenticate with our API
          if (session?.access_token) {
            await authenticateWithAPI(session.access_token);
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          await createUserProfile(session.user);
          await authenticateWithAPI(session.access_token);
        } else if (event === 'SIGNED_OUT') {
          // Clear API token on sign out
          if (typeof window !== 'undefined') {
            localStorage.removeItem('api_token');
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const authenticateWithAPI = async (supabaseToken) => {
    try {
      await apiClient.login(supabaseToken);
    } catch (error) {
      console.error('Error authenticating with API:', error);
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
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Authenticate with API after successful Supabase login
      if (data.session?.access_token) {
        await authenticateWithAPI(data.session.access_token);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in signIn:', error);
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
      
      // Logout from API first
      try {
        await apiClient.logout();
      } catch (error) {
        console.error('Error logging out from API:', error);
      }
      
      // Always sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out from Supabase:', error);
      }
      
      // Clear local state
      setUser(null);
      setSession(null);
      
    } catch (error) {
      console.error('Error in signOut:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    initialized,
    signIn,
    signOut,
    signUp,
    isAuthenticated: !!user,
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