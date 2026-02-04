# Supabase Setup Guide

This guide will help you set up Supabase for the Digital Signage Platform.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Choose your organization
4. Enter project name: "digital-signage-platform"
5. Enter a secure database password
6. Choose a region close to your users
7. Click "Create new project"

## 2. Get Project Credentials

Once your project is created:

1. Go to Settings → API
2. Copy the following values:
   - **Project URL** (starts with https://...)
   - **anon public key** (starts with eyJ...)
   - **service_role key** (starts with eyJ...)

## 3. Configure Environment Variables

### Backend (.env)
Create `backend/.env` file with:
```
SUPABASE_URL=your_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
JWT_SECRET=your_random_jwt_secret_here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
Create `frontend/.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 4. Set Up Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Copy the contents of `database/schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the schema

## 5. Configure Storage

1. Go to Storage in your Supabase dashboard
2. Click "Create a new bucket"
3. Name it "media"
4. Set it to "Public bucket" (for CDN access)
5. Click "Create bucket"

### Set Storage Policies

In the SQL Editor, copy and run the contents of `database/storage-policies.sql` to set up storage policies:

```sql
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
```

## 6. Configure Authentication

1. Go to Authentication → Settings
2. Under "Site URL", add your frontend URL: `http://localhost:3000`
3. Under "Redirect URLs", add: `http://localhost:3000/auth/callback`
4. Disable "Enable email confirmations" for development (optional)
5. Save configuration

## 7. Test Connection

Run the following to test your setup:

```bash
# Test Supabase configuration
node test-setup.js

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start backend
cd backend && npm run dev

# In another terminal, start frontend
cd frontend && npm run dev
```

## 8. Verify Setup

1. Check that both servers start without errors
2. Visit http://localhost:3000
3. Try to access the admin portal (should redirect to login)
4. Check browser console for any Supabase connection errors

## Troubleshooting

### Common Issues

1. **"Invalid API key"**: Double-check your environment variables
2. **CORS errors**: Ensure your frontend URL is added to Supabase settings
3. **Database connection failed**: Verify your project URL and service role key
4. **Storage upload fails**: Check that the "media" bucket exists and is public

### Getting Help

- Check Supabase documentation: https://supabase.com/docs
- Verify environment variables are loaded correctly
- Check browser network tab for API request errors
- Review Supabase dashboard logs for server-side errors

## Next Steps

Once Supabase is configured, you can proceed with implementing the authentication endpoints and admin portal login functionality. 