const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestData() {
  try {
    console.log('🚀 Creating test data for order tracking...')
    
    // Create or find user
    let user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    })
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        }
      })
      console.log(`✅ Created user: ${user.email} (ID: ${user.id})`)
    } else {
      console.log(`👤 Found existing user: ${user.email} (ID: ${user.id})`)
    }
    
    // Create or find store
    let store = await prisma.store.findFirst({
      where: { slug: 'test-store' }
    })
    
    if (!store) {
      store = await prisma.store.create({
        data: {
          ownerId: user.id,
          name: 'Test Store',
          slug: 'test-store',
          currency: 'INR',
        }
      })
      console.log(`✅ Created store: ${store.name} (ID: ${store.id})`)
    } else {
      console.log(`🏪 Found existing store: ${store.name} (ID: ${store.id})`)
    }
    
    // Create or find products
    let products = await prisma.product.findMany({
      where: { storeId: store.id }
    })
    
    if (products.length === 0) {
      const product1 = await prisma.product.create({
        data: {
          storeId: store.id,
          title: 'Test Product 1',
          price: 1000, // ₹10.00
          stock: 10,
          active: true,
        }
      })
      
      const product2 = await prisma.product.create({
        data: {
          storeId: store.id,
          title: 'Test Product 2',
          price: 2000, // ₹20.00
          stock: 5,
          active: true,
        }
      })
      
      products = [product1, product2]
      console.log(`✅ Created products: ${product1.title}, ${product2.title}`)
    } else {
      console.log(`📦 Found existing products: ${products.length}`)
    }
    
    // Create test orders
    const existingOrders = await prisma.order.findMany({
      where: { customerId: user.id }
    })
    
    if (existingOrders.length === 0) {
      // Create multiple test orders with different statuses
      const orders = [
        {
          status: 'PENDING',
          subtotal: 1000,
          totalAmount: 1000,
          productId: products[0].id,
          quantity: 1
        },
        {
          status: 'CONFIRMED',
          subtotal: 2000,
          totalAmount: 2000,
          productId: products[1].id,
          quantity: 1
        },
        {
          status: 'SHIPPED',
          subtotal: 3000,
          totalAmount: 3000,
          productId: products[0].id,
          quantity: 3
        },
        {
          status: 'DELIVERED',
          subtotal: 1000,
          totalAmount: 1000,
          productId: products[1].id,
          quantity: 1
        }
      ]
      
      for (const orderData of orders) {
        const order = await prisma.order.create({
          data: {
            customerId: user.id,
            storeId: store.id,
            buyerName: user.name,
            phone: '9876543210',
            email: user.email,
            address: 'Test Address, Test City, 123456',
            status: orderData.status,
            subtotal: orderData.subtotal,
            totalAmount: orderData.totalAmount,
            paymentMethod: 'COD',
            items: {
              create: {
                productId: orderData.productId,
                quantity: orderData.quantity,
                priceSnap: orderData.subtotal,
              }
            }
          }
        })
        console.log(`✅ Created order #${order.id}: ${order.status} - ₹${order.totalAmount/100}`)
      }
    } else {
      console.log(`📋 Found existing orders: ${existingOrders.length}`)
      existingOrders.forEach(order => {
        console.log(`  - Order #${order.id}: ${order.status} - ₹${order.totalAmount/100}`)
      })
    }
    
    // Test the API endpoint
    console.log('\n🧪 Testing API endpoint...')
    const response = await fetch('http://localhost:3000/api/customer/orders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (response.ok) {
      const orders = await response.json()
      console.log(`✅ API returned ${orders.length} orders`)
      orders.forEach(order => {
        console.log(`  - Order #${order.id}: ${order.status} - ₹${order.totalAmount/100}`)
      })
    } else {
      console.log(`❌ API error: ${response.status} ${response.statusText}`)
      const error = await response.text()
      console.log(`Error details: ${error}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestData()
