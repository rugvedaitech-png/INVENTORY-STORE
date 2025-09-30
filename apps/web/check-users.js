const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('Checking database connection...')
    await prisma.$connect()
    
    console.log('Fetching users...')
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`Found ${users.length} users:`)
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`)
    })
    
    const supplierUsers = users.filter(u => u.role === 'SUPPLIER')
    console.log(`\nSupplier users: ${supplierUsers.length}`)
    supplierUsers.forEach(user => {
      console.log(`- ${user.email} (${user.name})`)
    })
    
    console.log('\nChecking suppliers...')
    const suppliers = await prisma.supplier.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        userId: true,
        storeId: true
      }
    })
    
    console.log(`Found ${suppliers.length} suppliers:`)
    suppliers.forEach(supplier => {
      console.log(`- ID: ${supplier.id}, Name: ${supplier.name}, Email: ${supplier.email}, UserID: ${supplier.userId}, StoreID: ${supplier.storeId}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
