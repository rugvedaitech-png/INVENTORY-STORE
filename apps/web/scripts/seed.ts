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

  // Create customer record
  await prisma.customer.upsert({
    where: { email: 'customer@demo.com' },
    update: {},
    create: {
      email: 'customer@demo.com',
      name: 'Demo Customer',
      phone: '919876543212',
      address: '123 Demo Street, Demo City',
      userId: customer.id,
    },
  })

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
