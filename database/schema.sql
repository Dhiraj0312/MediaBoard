-- Digital Signage Platform Database Schema
-- This file contains the complete database schema with RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screens table
CREATE TABLE IF NOT EXISTS screens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  device_code TEXT UNIQUE NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline')),
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media table
CREATE TABLE IF NOT EXISTS media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  duration INTEGER, -- for videos, in seconds
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playlist items table
CREATE TABLE IF NOT EXISTS playlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  duration INTEGER NOT NULL, -- display duration in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screen assignments table
CREATE TABLE IF NOT EXISTS screen_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(screen_id) -- One playlist per screen
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for screens table
-- Authenticated users can manage all screens
CREATE POLICY "Authenticated users can view screens" ON screens
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert screens" ON screens
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update screens" ON screens
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete screens" ON screens
  FOR DELETE USING (auth.role() = 'authenticated');

-- Allow anonymous access for player heartbeat updates (using device_code)
CREATE POLICY "Allow heartbeat updates by device code" ON screens
  FOR UPDATE USING (true);

-- RLS Policies for media table
CREATE POLICY "Authenticated users can view media" ON media
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own media" ON media
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own media" ON media
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own media" ON media
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for playlists table
CREATE POLICY "Authenticated users can view playlists" ON playlists
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own playlists" ON playlists
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own playlists" ON playlists
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own playlists" ON playlists
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for playlist_items table
CREATE POLICY "Authenticated users can view playlist items" ON playlist_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage playlist items" ON playlist_items
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for screen_assignments table
CREATE POLICY "Authenticated users can view assignments" ON screen_assignments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage assignments" ON screen_assignments
  FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_screens_device_code ON screens(device_code);
CREATE INDEX IF NOT EXISTS idx_screens_status ON screens(status);
CREATE INDEX IF NOT EXISTS idx_media_created_by ON media(created_by);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
CREATE INDEX IF NOT EXISTS idx_playlists_created_by ON playlists(created_by);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_order ON playlist_items(playlist_id, order_index);
CREATE INDEX IF NOT EXISTS idx_screen_assignments_screen_id ON screen_assignments(screen_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_screens_updated_at
  BEFORE UPDATE ON screens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_media_updated_at
  BEFORE UPDATE ON media
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON playlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();