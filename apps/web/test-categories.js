// Test script for categories functionality
const BASE_URL = 'http://localhost:3000'

async function testCategories() {
  console.log('🧪 Testing Categories System...\n')

  try {
    // Test 1: List categories for a store
    console.log('1. Testing store categories...')
    const categoriesResponse = await fetch(`${BASE_URL}/api/stores/demo-ration-store/categories`)
    console.log('Categories response status:', categoriesResponse.status)
    
    if (categoriesResponse.ok) {
      const data = await categoriesResponse.json()
      console.log('✅ Categories found:', data.categories.length)
      data.categories.forEach(cat => {
        console.log(`   - ${cat.name}: ${cat._count.products} products`)
      })
    } else {
      const error = await categoriesResponse.json()
      console.log('❌ Categories failed:', error)
    }

    // Test 2: List products with categories
    console.log('\n2. Testing products with categories...')
    const productsResponse = await fetch(`${BASE_URL}/api/products`)
    console.log('Products response status:', productsResponse.status)
    
    if (productsResponse.ok) {
      const data = await productsResponse.json()
      console.log('✅ Products found:', data.products.length)
      data.products.forEach(product => {
        console.log(`   - ${product.title}: ${product.category?.name || 'No category'}`)
      })
    } else {
      const error = await productsResponse.json()
      console.log('❌ Products failed:', error)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testCategories()
