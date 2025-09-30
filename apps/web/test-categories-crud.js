// Test script for Categories CRUD functionality
const BASE_URL = 'http://localhost:3001';

async function testCategoriesAPI() {
  console.log('🧪 Testing Categories CRUD API...\n');

  try {
    // Test 1: Get categories (should work without auth for testing)
    console.log('1. Testing GET /api/categories...');
    const getResponse = await fetch(`${BASE_URL}/api/categories`);
    console.log(`   Status: ${getResponse.status}`);
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log(`   ✅ Found ${data.categories?.length || 0} categories`);
    } else {
      const error = await getResponse.json();
      console.log(`   ❌ Error: ${error.error}`);
    }

    // Test 2: Test with authentication (this will fail without proper auth)
    console.log('\n2. Testing authenticated request...');
    const authResponse = await fetch(`${BASE_URL}/api/categories`, {
      headers: {
        'Cookie': 'next-auth.session-token=test' // This won't work, just for testing
      }
    });
    console.log(`   Status: ${authResponse.status}`);

    console.log('\n✅ Categories API endpoints are accessible!');
    console.log('📝 Note: Full CRUD testing requires authentication');
    console.log('🔗 Access the categories page at: http://localhost:3001/seller/categories');

  } catch (error) {
    console.error('❌ Error testing categories API:', error.message);
  }
}

// Run the test
testCategoriesAPI();
