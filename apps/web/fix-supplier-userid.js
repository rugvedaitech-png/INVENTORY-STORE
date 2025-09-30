const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixSupplierUserId() {
  try {
    console.log('🔧 Fixing Supplier userId column...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Connected to database')
    
    // Check if userId column exists by trying to query it
    try {
      const testQuery = await prisma.$queryRaw`SELECT userId FROM Supplier LIMIT 1`
      console.log('✅ userId column already exists')
    } catch (error) {
      console.log('❌ userId column does not exist, adding it...')
      
      // Add userId column
      await prisma.$executeRaw`ALTER TABLE Supplier ADD COLUMN userId INT`
      console.log('✅ Added userId column')
      
      // Add unique constraint
      await prisma.$executeRaw`ALTER TABLE Supplier ADD CONSTRAINT Supplier_userId_key UNIQUE (userId)`
      console.log('✅ Added unique constraint')
    }
    
    // Test the column
    const suppliers = await prisma.supplier.findMany({
      where: { userId: null },
      take: 1
    })
    console.log('✅ userId column is working correctly')
    console.log(`Found ${suppliers.length} suppliers without userId`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixSupplierUserId()
