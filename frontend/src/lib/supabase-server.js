import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Server-side Supabase client for use in server components and API routes
export const createServerClient = () => {
  return createServerComponentClient({ 
    cookies,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
};

// Server-side helper to get user session
export const getServerSession = async () => {
  const supabase = createServerClient();
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting server session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error in getServerSession:', error);
    return null;
  }
};

// Server-side helper to get user
export const getServerUser = async () => {
  const supabase = createServerClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting server user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error in getServerUser:', error);
    return null;
  }
};