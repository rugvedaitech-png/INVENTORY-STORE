import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Hash the demo password
  const hashedPassword = await bcrypt.hash('password123', 12)

  // Create demo users for different roles
  const storeOwner = await prisma.user.upsert({
    where: { email: 'demo@boutique.test' },
    update: {},
    create: {
      email: 'demo@boutique.test',
      name: 'Demo Store Owner',
      password: hashedPassword,
      role: 'STORE_OWNER',
      phone: '919876543210',
    },
  })

  const supplier = await prisma.user.upsert({
    where: { email: 'supplier@demo.com' },
    update: {},
    create: {
      email: 'supplier@demo.com',
      name: 'Demo Supplier',
      password: hashedPassword,
      role: 'SUPPLIER',
      phone: '919876543211',
    },
  })

  const customer = await prisma.user.upsert({
    where: { email: 'customer@demo.com' },
    update: {},
    create: {
      email: 'customer@demo.com',
      name: 'Demo Customer',
      password: hashedPassword,
      role: 'CUSTOMER',
      phone: '919876543212',
    },
  })

  // Create customer record (after store is created)
  // We'll create this after the store is created

  console.log('✅ Created users:', { storeOwner: storeOwner.email, supplier: supplier.email, customer: customer.email })

  // Create ration store
  const store = await prisma.store.upsert({
    where: { slug: 'demo-ration-store' },
    update: {},
    create: {
      ownerId: storeOwner.id,
      name: 'Demo Ration Store',
      slug: 'demo-ration-store',
      whatsapp: '919876543210',
      upiId: 'demo@upi',
      currency: 'INR',
    },
  })

  console.log('✅ Created store:', store.name)

  // Add ration store categories
  const categories = [
    {
      name: 'Rice & Grains',
      description: 'Basmati rice, regular rice, wheat, and other grains',
      sortOrder: 1,
    },
    {
      name: 'Pulses & Lentils',
      description: 'Dal, chana, rajma, and other protein-rich pulses',
      sortOrder: 2,
    },
    {
      name: 'Cooking Oil',
      description: 'Sunflower oil, mustard oil, coconut oil, and ghee',
      sortOrder: 3,
    },
    {
      name: 'Sugar & Sweeteners',
      description: 'White sugar, brown sugar, jaggery, and honey',
      sortOrder: 4,
    },
    {
      name: 'Salt & Spices',
      description: 'Table salt, rock salt, turmeric, red chili, and masala',
      sortOrder: 5,
    },
    {
      name: 'Flour & Atta',
      description: 'Wheat flour, rice flour, besan, and other flours',
      sortOrder: 6,
    },
    {
      name: 'Tea & Coffee',
      description: 'Tea leaves, coffee powder, and related beverages',
      sortOrder: 7,
    },
    {
      name: 'Dry Fruits & Nuts',
      description: 'Almonds, cashews, raisins, and other dry fruits',
      sortOrder: 8,
    },
    {
      name: 'Cereals & Breakfast',
      description: 'Cornflakes, oats, poha, and breakfast items',
      sortOrder: 9,
    },
    {
      name: 'Canned & Packaged',
      description: 'Canned vegetables, pickles, and packaged foods',
      sortOrder: 10,
    },
  ]

  for (const categoryData of categories) {
    const slug = categoryData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    await prisma.category.create({
      data: {
        ...categoryData,
        storeId: store.id,
        slug: slug,
      },
    })
  }

  console.log('✅ Created categories:', categories.length)

  // Create customer record
  const customerRecord = await prisma.customer.upsert({
    where: { email: 'customer@demo.com' },
    update: {},
    create: {
      email: 'customer@demo.com',
      name: 'Demo Customer',
      phone: '919876543212',
      address: '123 Demo Street, Demo City', // Will be migrated to addresses table
      userId: customer.id,
      storeId: store.id,
    },
  })

  console.log('✅ Created customer record')

  // Create demo addresses for the customer
  await prisma.customerAddress.create({
    data: {
      customerId: customerRecord.id,
      title: 'Home',
      fullName: 'Demo Customer',
      phone: '919876543212',
      address: '123 Demo Street, Apartment 4B',
      city: 'Demo City',
      state: 'Demo State',
      pincode: '123456',
      isActive: true, // First address is active
    },
  })

  await prisma.customerAddress.create({
    data: {
      customerId: customerRecord.id,
      title: 'Office',
      fullName: 'Demo Customer',
      phone: '919876543212',
      address: '456 Business Park, Floor 3',
      city: 'Demo City',
      state: 'Demo State',
      pincode: '123457',
      isActive: false, // Inactive address
    },
  })

  console.log('✅ Created demo customer addresses')

  // Create ration supplier
  const rationSupplier = await prisma.supplier.create({
    data: {
      storeId: store.id,
      name: 'Grain & Grocery Wholesale Ltd.',
      email: 'orders@grainwholesale.com',
      phone: '9876543210',
      address: '123 Grain Market, Delhi, India 110001',
      leadTimeDays: 2,
    },
  })

  console.log('✅ Created supplier:', rationSupplier.name)

  // Get categories for product assignment
  const createdCategories = await prisma.category.findMany({
    where: { storeId: store.id },
    orderBy: { sortOrder: 'asc' }
  })

  // Create ration store products
  const products = [
    {
      title: 'Basmati Rice (1kg)',
      description: 'Premium quality basmati rice, perfect for daily consumption',
      sku: 'RICE-001',
      price: 12000, // ₹120.00
      costPrice: 10000, // ₹100.00
      stock: 50,
      reorderPoint: 10,
      reorderQty: 100,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=1']),
      categoryId: createdCategories.find(c => c.name === 'Rice & Grains')?.id,
    },
    {
      title: 'Whole Wheat Flour (1kg)',
      description: 'Freshly ground whole wheat flour for rotis and breads',
      sku: 'WHEAT-001',
      price: 4500, // ₹45.00
      costPrice: 3500, // ₹35.00
      stock: 30,
      reorderPoint: 8,
      reorderQty: 50,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=2']),
      categoryId: createdCategories.find(c => c.name === 'Flour & Atta')?.id,
    },
    {
      title: 'Toor Dal (500g)',
      description: 'High protein toor dal, essential for daily nutrition',
      sku: 'DAL-001',
      price: 8000, // ₹80.00
      costPrice: 6500, // ₹65.00
      stock: 25,
      reorderPoint: 5,
      reorderQty: 40,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=3']),
      categoryId: createdCategories.find(c => c.name === 'Pulses & Lentils')?.id,
    },
    {
      title: 'Cooking Oil (1L)',
      description: 'Refined sunflower oil for healthy cooking',
      sku: 'OIL-001',
      price: 12000, // ₹120.00
      costPrice: 9500, // ₹95.00
      stock: 20,
      reorderPoint: 5,
      reorderQty: 30,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=4']),
      categoryId: createdCategories.find(c => c.name === 'Cooking Oil')?.id,
    },
    {
      title: 'Sugar (1kg)',
      description: 'Pure white sugar for daily use',
      sku: 'SUGAR-001',
      price: 4500, // ₹45.00
      costPrice: 3500, // ₹35.00
      stock: 40,
      reorderPoint: 8,
      reorderQty: 50,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=5']),
      categoryId: createdCategories.find(c => c.name === 'Sugar & Sweeteners')?.id,
    },
    {
      title: 'Salt (500g)',
      description: 'Iodized table salt for daily cooking needs',
      sku: 'SALT-001',
      price: 1500, // ₹15.00
      costPrice: 1000, // ₹10.00
      stock: 60,
      reorderPoint: 10,
      reorderQty: 100,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=6']),
      categoryId: createdCategories.find(c => c.name === 'Salt & Spices')?.id,
    },
    {
      title: 'Red Lentils (500g)',
      description: 'Masoor dal - rich in protein and easy to cook',
      sku: 'LENTIL-001',
      price: 7000, // ₹70.00
      costPrice: 5500, // ₹55.00
      stock: 35,
      reorderPoint: 8,
      reorderQty: 50,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=7']),
      categoryId: createdCategories.find(c => c.name === 'Pulses & Lentils')?.id,
    },
    {
      title: 'Chickpeas (500g)',
      description: 'Kabuli chana - versatile and nutritious legume',
      sku: 'CHANA-001',
      price: 6000, // ₹60.00
      costPrice: 4500, // ₹45.00
      stock: 28,
      reorderPoint: 6,
      reorderQty: 40,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=8']),
      categoryId: createdCategories.find(c => c.name === 'Pulses & Lentils')?.id,
    },
    {
      title: 'Black Gram (500g)',
      description: 'Urad dal - essential for South Indian cuisine',
      sku: 'URAD-001',
      price: 7500, // ₹75.00
      costPrice: 6000, // ₹60.00
      stock: 22,
      reorderPoint: 5,
      reorderQty: 35,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=9']),
      categoryId: createdCategories.find(c => c.name === 'Pulses & Lentils')?.id,
    },
    {
      title: 'Green Gram (500g)',
      description: 'Moong dal - light and easy to digest',
      sku: 'MOONG-001',
      price: 6500, // ₹65.00
      costPrice: 5000, // ₹50.00
      stock: 30,
      reorderPoint: 6,
      reorderQty: 45,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=10']),
      categoryId: createdCategories.find(c => c.name === 'Pulses & Lentils')?.id,
    },
  ]

  const createdProducts = []
  for (const productData of products) {
    const product = await prisma.product.create({
      data: {
        ...productData,
        storeId: store.id,
      },
    })
    createdProducts.push(product)
  }

  console.log('✅ Created products:', createdProducts.length)

  // Create demo purchase order
  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      storeId: store.id,
      supplierId: rationSupplier.id,
      code: 'PO-2025-0001',
      status: 'SENT',
      notes: 'Regular restock order',
      subtotal: 272500, // ₹2,725.00 (20 * 10000 + 15 * 3500)
      total: 272500,
      placedAt: new Date(),
      items: {
        create: [
          {
            productId: createdProducts[0].id, // Basmati Rice
            qty: 20,
            costPaise: 10000, // ₹100.00
          },
          {
            productId: createdProducts[1].id, // Whole Wheat Flour
            qty: 15,
            costPaise: 3500, // ₹35.00
          },
        ]
      },
    },
  })

  console.log('✅ Created purchase order:', purchaseOrder.code)

  // Create some stock ledger entries for demo
  await prisma.stockLedger.createMany({
    data: [
      {
        storeId: store.id,
        productId: createdProducts[0].id,
        refType: 'PO_RECEIPT',
        refId: purchaseOrder.id,
        delta: 20,
        unitCost: 10000, // ₹100.00
      },
      {
        storeId: store.id,
        productId: createdProducts[1].id,
        refType: 'PO_RECEIPT',
        refId: purchaseOrder.id,
        delta: 15,
        unitCost: 3500, // ₹35.00
      },
    ],
  })

  console.log('✅ Created stock ledger entries')

  console.log('🎉 Ration store database seeded successfully!')
  console.log('')
  console.log('Ration store URL: http://localhost:3000/demo-ration-store')
  console.log('Seller login: demo@boutique.test')
  console.log('')
  console.log('Ration items created:')
  createdProducts.forEach((product, index) => {
    console.log(`  ${index + 1}. ${product.title} - ₹${(product.price / 100).toFixed(2)}`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
