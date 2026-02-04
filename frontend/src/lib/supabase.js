'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Supabase configuration
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseConfig.url,
    anonKey: !!supabaseConfig.anonKey
  });
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Client-side Supabase client for use in components
export const createClient = () => {
  return createClientComponentClient({
    supabaseUrl: supabaseConfig.url,
    supabaseKey: supabaseConfig.anonKey,
  });
};

// Storage helper functions
export const getStorageUrl = (path) => {
  if (!path) return null;
  return `${supabaseConfig.url}/storage/v1/object/public/media/${path}`;
};

export const uploadFile = async (file, path) => {
  const supabase = createClient();
  
  const { data, error } = await supabase.storage
    .from('media')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw error;
  }

  return data;
};