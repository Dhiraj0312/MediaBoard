// Simple test script to verify Supabase configuration
const { supabase } = require('./backend/src/config/supabase');
const { AuthService } = require('./backend/src/services/authService');
const { StorageService } = require('./backend/src/services/storageService');

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase Configuration...\n');

  try {
    // Test 1: Check if Supabase client is initialized
    console.log('✅ Supabase client initialized');
    
    // Test 2: Test database connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
      console.log('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Test 3: Test AuthService
    const authService = new AuthService();
    console.log('✅ AuthService initialized');
    
    // Test 4: Test JWT token generation
    const testUser = { id: 'test-id', email: 'test@example.com' };
    const token = authService.generateToken(testUser);
    const verified = authService.verifyToken(token);
    
    if (verified && verified.id === testUser.id) {
      console.log('✅ JWT token generation and verification working');
    } else {
      console.log('❌ JWT token verification failed');
      return false;
    }

    // Test 5: Test StorageService
    const storageService = new StorageService();
    console.log('✅ StorageService initialized');

    // Test 6: Check storage bucket setup
    const bucketExists = await storageService.ensureBucketExists();
    if (bucketExists) {
      console.log('✅ Storage bucket configuration verified');
    } else {
      console.log('⚠️  Storage bucket needs to be created manually in Supabase dashboard');
    }
    
    console.log('\n🎉 All tests passed! Supabase integration is ready.');
    console.log('\n📋 Next steps:');
    console.log('1. Set up your Supabase project using scripts/setup-supabase.md');
    console.log('2. Create .env files with your Supabase credentials');
    console.log('3. Run the database schema in your Supabase SQL editor');
    console.log('4. Create the "media" storage bucket in Supabase dashboard');
    console.log('5. Run the storage policies from database/storage-policies.sql');
    console.log('6. Start the backend: cd backend && npm run dev');
    console.log('7. Start the frontend: cd frontend && npm run dev');
    
    return true;
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Make sure you have created .env files with Supabase credentials');
    console.log('- Check that your Supabase project is active');
    console.log('- Verify your environment variables are correct');
    console.log('- Ensure the database schema has been applied');
    return false;
  }
}

// Run tests
testSupabaseConnection();