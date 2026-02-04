-- Storage policies for the media bucket
-- Run this after creating the 'media' bucket in Supabase Storage

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Authenticated users can upload media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to view all media files
CREATE POLICY "Authenticated users can view media" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'media' AND 
    auth.role() = 'authenticated'
  );

-- Allow public access to view files (for web player)
CREATE POLICY "Public can view media files" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'media' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'media' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );