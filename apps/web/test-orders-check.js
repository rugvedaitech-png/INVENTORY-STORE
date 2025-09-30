const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkOrders() {
  try {
    console.log('🔍 Checking orders in database...')
    
    // Check total orders
    const totalOrders = await prisma.order.count()
    console.log(`📊 Total orders in database: ${totalOrders}`)
    
    if (totalOrders === 0) {
      console.log('❌ No orders found. Creating test data...')
      
      // Check if we have users
      const users = await prisma.user.findMany()
      console.log(`👥 Users in database: ${users.length}`)
      
      if (users.length === 0) {
        console.log('👤 Creating test user...')
        const user = await prisma.user.create({
          data: {
            email: 'test@example.com',
            name: 'Test User',
          }
        })
        console.log(`✅ Created user: ${user.email} (ID: ${user.id})`)
      }
      
      // Check if we have stores
      const stores = await prisma.store.findMany()
      console.log(`🏪 Stores in database: ${stores.length}`)
      
      if (stores.length === 0) {
        console.log('🏪 Creating test store...')
        const user = await prisma.user.findFirst()
        const store = await prisma.store.create({
          data: {
            ownerId: user.id,
            name: 'Test Store',
            slug: 'test-store',
            currency: 'INR',
          }
        })
        console.log(`✅ Created store: ${store.name} (ID: ${store.id})`)
      }
      
      // Check if we have products
      const products = await prisma.product.findMany()
      console.log(`📦 Products in database: ${products.length}`)
      
      if (products.length === 0) {
        console.log('📦 Creating test products...')
        const store = await prisma.store.findFirst()
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
        console.log(`✅ Created products: ${product1.title}, ${product2.title}`)
      }
      
      // Create test orders
      console.log('🛒 Creating test orders...')
      const user = await prisma.user.findFirst()
      const store = await prisma.store.findFirst()
      const products = await prisma.product.findMany()
      
      // Create customer record
      const customer = await prisma.customer.create({
        data: {
          userId: user.id,
          storeId: store.id,
          name: user.name,
          email: user.email,
          phone: '9876543210',
          address: 'Test Address, Test City, 123456',
        }
      })
      console.log(`✅ Created customer: ${customer.name}`)
      
      // Create test orders
      const order1 = await prisma.order.create({
        data: {
          customerId: customer.id,
          storeId: store.id,
          buyerName: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          status: 'PENDING',
          subtotal: 1000,
          totalAmount: 1000,
          paymentMethod: 'COD',
          items: {
            create: {
              productId: products[0].id,
              quantity: 1,
              priceSnap: products[0].price,
            }
          }
        }
      })
      
      const order2 = await prisma.order.create({
        data: {
          customerId: customer.id,
          storeId: store.id,
          buyerName: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          status: 'CONFIRMED',
          subtotal: 2000,
          totalAmount: 2000,
          paymentMethod: 'COD',
          items: {
            create: {
              productId: products[1].id,
              quantity: 1,
              priceSnap: products[1].price,
            }
          }
        }
      })
      
      console.log(`✅ Created orders: ${order1.id}, ${order2.id}`)
    } else {
      // Show existing orders
      const orders = await prisma.order.findMany({
        include: {
          customer: true,
          store: true,
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
      
      console.log('📋 Recent orders:')
      orders.forEach(order => {
        console.log(`  - Order #${order.id}: ${order.status} - ₹${order.totalAmount/100} - ${order.customer?.name || 'Unknown'}`)
      })
    }
    
    // Check customer orders specifically
    const customerOrders = await prisma.order.findMany({
      where: {
        customer: {
          userId: { not: null }
        }
      },
      include: {
        customer: true
      }
    })
    
    console.log(`👤 Orders with customer users: ${customerOrders.length}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkOrders()
