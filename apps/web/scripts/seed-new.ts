import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed with auto-increment IDs...')

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

  console.log('✅ Created users:', { 
    storeOwner: storeOwner.email, 
    supplier: supplier.email, 
    customer: customer.email 
  })

  // Create store
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

  // Create customer record linked to store (required)
  await prisma.customer.upsert({
    where: { email: 'customer@demo.com' },
    update: {},
    create: {
      email: 'customer@demo.com',
      name: 'Demo Customer',
      phone: '919876543212',
      address: '123 Demo Street, Demo City',
      userId: customer.id,
      storeId: store.id, // Required - customer belongs to this store
    },
  })

  console.log('✅ Created customer record')

  // Create supplier
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

  // Create ration store products
  const products = [
    {
      title: 'Basmati Rice (1kg)',
      description: 'Premium quality basmati rice, perfect for daily meals',
      sku: 'RICE-BAS-001',
      price: 12000, // ₹120.00
      costPrice: 10000, // ₹100.00
      stock: 50,
      reorderPoint: 10,
      reorderQty: 25,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=1']),
    },
    {
      title: 'Whole Wheat Flour (1kg)',
      description: 'Freshly ground whole wheat flour for healthy rotis',
      sku: 'FLOUR-WW-001',
      price: 4500, // ₹45.00
      costPrice: 3500, // ₹35.00
      stock: 30,
      reorderPoint: 5,
      reorderQty: 15,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=2']),
    },
    {
      title: 'Red Lentils (500g)',
      description: 'High protein red lentils, great for dal',
      sku: 'LENTIL-RED-001',
      price: 8000, // ₹80.00
      costPrice: 6500, // ₹65.00
      stock: 25,
      reorderPoint: 8,
      reorderQty: 20,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=3']),
    },
    {
      title: 'Chickpeas (500g)',
      description: 'Nutritious chickpeas for salads and curries',
      sku: 'CHICKPEA-001',
      price: 7500, // ₹75.00
      costPrice: 6000, // ₹60.00
      stock: 20,
      reorderPoint: 5,
      reorderQty: 15,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=4']),
    },
    {
      title: 'Cooking Oil (1L)',
      description: 'Refined sunflower oil for cooking',
      sku: 'OIL-SUN-001',
      price: 15000, // ₹150.00
      costPrice: 12000, // ₹120.00
      stock: 15,
      reorderPoint: 5,
      reorderQty: 10,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=5']),
    },
    {
      title: 'Sugar (1kg)',
      description: 'Pure white sugar for daily use',
      sku: 'SUGAR-WHITE-001',
      price: 5500, // ₹55.00
      costPrice: 4500, // ₹45.00
      stock: 40,
      reorderPoint: 10,
      reorderQty: 20,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=6']),
    },
    {
      title: 'Salt (1kg)',
      description: 'Iodized table salt',
      sku: 'SALT-IOD-001',
      price: 2500, // ₹25.00
      costPrice: 2000, // ₹20.00
      stock: 60,
      reorderPoint: 15,
      reorderQty: 30,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=7']),
    },
    {
      title: 'Turmeric Powder (100g)',
      description: 'Pure turmeric powder for cooking',
      sku: 'SPICE-TUR-001',
      price: 3500, // ₹35.00
      costPrice: 2800, // ₹28.00
      stock: 25,
      reorderPoint: 5,
      reorderQty: 15,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=8']),
    },
    {
      title: 'Cumin Seeds (100g)',
      description: 'Aromatic cumin seeds for tempering',
      sku: 'SPICE-CUM-001',
      price: 4500, // ₹45.00
      costPrice: 3500, // ₹35.00
      stock: 20,
      reorderPoint: 5,
      reorderQty: 10,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=9']),
    },
    {
      title: 'Black Pepper (50g)',
      description: 'Whole black peppercorns',
      sku: 'SPICE-PEP-001',
      price: 5500, // ₹55.00
      costPrice: 4500, // ₹45.00
      stock: 15,
      reorderPoint: 3,
      reorderQty: 8,
      supplierId: rationSupplier.id,
      images: JSON.stringify(['https://picsum.photos/400/400?random=10']),
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
      subtotal: 272500, // ₹2,725.00
      total: 272500,   // ₹2,725.00
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
        ],
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
  console.log('Store URL: http://localhost:3000/demo-ration-store')
  console.log('Store Owner Login: demo@boutique.test / password123')
  console.log('Supplier Login: supplier@demo.com / password123')
  console.log('Customer Login: customer@demo.com / password123')
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
