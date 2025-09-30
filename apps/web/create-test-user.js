const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    console.log('Creating test supplier user...')
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: 'supplier@demo.com',
        name: 'Test Supplier',
        password: hashedPassword,
        role: 'SUPPLIER',
        phone: '1234567890'
      }
    })
    
    console.log('User created:', user)
    
    // Create a test store
    const store = await prisma.store.create({
      data: {
        ownerId: user.id,
        name: 'Demo Store',
        slug: 'demo-store',
        whatsapp: '919876543210',
        upiId: 'demo@upi'
      }
    })
    
    console.log('Store created:', store)
    
    // Create supplier record
    const supplier = await prisma.supplier.create({
      data: {
        storeId: store.id,
        userId: user.id,
        name: 'Test Supplier',
        email: 'supplier@demo.com',
        phone: '1234567890',
        address: 'Test Address'
      }
    })
    
    console.log('Supplier created:', supplier)
    
    console.log('\nTest user created successfully!')
    console.log('Email: supplier@demo.com')
    console.log('Password: password123')
    console.log('Role: SUPPLIER')
    
  } catch (error) {
    console.error('Error creating test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
