// Test script for products API endpoints
const BASE_URL = 'http://localhost:3000'

// Test data
const testProduct = {
  title: 'Test Product',
  description: 'A test product for API testing',
  sku: 'TEST-001',
  price: 1999, // ₹19.99 in paise
  costPrice: 1500, // ₹15.00 in paise
  stock: 100,
  images: '["https://picsum.photos/300/300?random=1"]',
  active: true
}

async function testProductsAPI() {
  console.log('🧪 Testing Products API...\n')

  try {
    // Test 1: Create a product (requires authentication)
    console.log('1. Testing product creation...')
    const createResponse = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real testing, you'd need to include authentication headers
      },
      body: JSON.stringify(testProduct)
    })
    
    console.log('Create response status:', createResponse.status)
    if (createResponse.ok) {
      const createdProduct = await createResponse.json()
      console.log('✅ Product created:', createdProduct.id)
      return createdProduct.id
    } else {
      const error = await createResponse.json()
      console.log('❌ Create failed:', error)
    }

    // Test 2: List products
    console.log('\n2. Testing product listing...')
    const listResponse = await fetch(`${BASE_URL}/api/products`)
    console.log('List response status:', listResponse.status)
    
    if (listResponse.ok) {
      const data = await listResponse.json()
      console.log('✅ Products listed:', data.products.length, 'products found')
    } else {
      const error = await listResponse.json()
      console.log('❌ List failed:', error)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testProductsAPI()
