const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRugvedaStore() {
  try {
    console.log('🔍 Looking for user: rugvedaitech@gmail.com');
    
    // Find the existing user
    const user = await prisma.user.findUnique({
      where: { email: 'rugvedaitech@gmail.com' },
      include: { store: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      storeId: user.storeId,
      currentStore: user.store ? user.store.name : 'None'
    });

    // Create a new store for this user
    console.log('🏪 Creating new store for Rugveda...');
    
    const newStore = await prisma.store.create({
      data: {
        name: 'Rugveda Itech Store',
        slug: 'rugveda-itech-store',
        whatsapp: '919876543210',
        upiId: 'rugveda@upi',
        currency: 'INR',
        ownerId: user.id
      }
    });

    console.log('✅ New store created:', {
      id: newStore.id,
      name: newStore.name,
      slug: newStore.slug,
      ownerId: newStore.ownerId
    });

    // Update user with new storeId
    await prisma.user.update({
      where: { id: user.id },
      data: { storeId: newStore.id }
    });

    console.log('✅ User updated with new storeId:', newStore.id);

    // Add ration store categories
    console.log('📂 Adding ration store categories...');
    const categories = [
      { name: 'Rice & Grains', description: 'Basmati rice, regular rice, wheat, and other grains', sortOrder: 1 },
      { name: 'Pulses & Lentils', description: 'Dal, chana, rajma, and other protein-rich pulses', sortOrder: 2 },
      { name: 'Cooking Oil', description: 'Sunflower oil, mustard oil, coconut oil, and ghee', sortOrder: 3 },
      { name: 'Sugar & Sweeteners', description: 'White sugar, brown sugar, jaggery, and honey', sortOrder: 4 },
      { name: 'Salt & Spices', description: 'Table salt, rock salt, turmeric, red chili, and masala', sortOrder: 5 },
      { name: 'Flour & Atta', description: 'Wheat flour, rice flour, besan, and other flours', sortOrder: 6 },
      { name: 'Tea & Coffee', description: 'Tea leaves, coffee powder, and related beverages', sortOrder: 7 },
      { name: 'Dry Fruits & Nuts', description: 'Almonds, cashews, raisins, and other dry fruits', sortOrder: 8 },
      { name: 'Cereals & Breakfast', description: 'Cornflakes, oats, poha, and breakfast items', sortOrder: 9 },
      { name: 'Canned & Packaged', description: 'Canned vegetables, pickles, and packaged foods', sortOrder: 10 }
    ];

    for (const categoryData of categories) {
      const slug = categoryData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      await prisma.category.create({
        data: {
          ...categoryData,
          storeId: newStore.id,
          slug: slug,
        },
      });
    }

    console.log('✅ Categories added');

    // Get categories for product assignment
    const createdCategories = await prisma.category.findMany({
      where: { storeId: newStore.id },
      orderBy: { sortOrder: 'asc' }
    });

    // Add sample products
    console.log('📦 Adding sample products...');
    const products = [
      {
        title: 'Basmati Rice (1kg)',
        description: 'Premium quality basmati rice, perfect for daily consumption',
        sku: 'RICE-001',
        price: 12000,
        costPrice: 10000,
        stock: 50,
        reorderPoint: 10,
        reorderQty: 100,
        images: JSON.stringify(['https://picsum.photos/400/400?random=1']),
        active: true,
        categoryId: createdCategories.find(c => c.name === 'Rice & Grains')?.id,
      },
      {
        title: 'Whole Wheat Flour (1kg)',
        description: 'Freshly ground whole wheat flour for rotis and breads',
        sku: 'WHEAT-001',
        price: 4500,
        costPrice: 3500,
        stock: 30,
        reorderPoint: 8,
        reorderQty: 50,
        images: JSON.stringify(['https://picsum.photos/400/400?random=2']),
        active: true,
        categoryId: createdCategories.find(c => c.name === 'Flour & Atta')?.id,
      },
      {
        title: 'Toor Dal (500g)',
        description: 'High protein toor dal, essential for daily nutrition',
        sku: 'DAL-001',
        price: 8000,
        costPrice: 6500,
        stock: 25,
        reorderPoint: 5,
        reorderQty: 40,
        images: JSON.stringify(['https://picsum.photos/400/400?random=3']),
        active: true,
        categoryId: createdCategories.find(c => c.name === 'Pulses & Lentils')?.id,
      },
      {
        title: 'Cooking Oil (1L)',
        description: 'Refined sunflower oil for healthy cooking',
        sku: 'OIL-001',
        price: 12000,
        costPrice: 9500,
        stock: 20,
        reorderPoint: 5,
        reorderQty: 30,
        images: JSON.stringify(['https://picsum.photos/400/400?random=4']),
        active: true,
        categoryId: createdCategories.find(c => c.name === 'Cooking Oil')?.id,
      },
      {
        title: 'Sugar (1kg)',
        description: 'Pure white sugar for daily use',
        sku: 'SUGAR-001',
        price: 4500,
        costPrice: 3500,
        stock: 40,
        reorderPoint: 8,
        reorderQty: 50,
        images: JSON.stringify(['https://picsum.photos/400/400?random=5']),
        active: true,
        categoryId: createdCategories.find(c => c.name === 'Sugar & Sweeteners')?.id,
      },
      {
        title: 'Salt (500g)',
        description: 'Iodized table salt for daily cooking needs',
        sku: 'SALT-001',
        price: 1500,
        costPrice: 1000,
        stock: 60,
        reorderPoint: 10,
        reorderQty: 100,
        images: JSON.stringify(['https://picsum.photos/400/400?random=6']),
        active: true,
        categoryId: createdCategories.find(c => c.name === 'Salt & Spices')?.id,
      }
    ];

    for (const productData of products) {
      await prisma.product.create({
        data: {
          ...productData,
          storeId: newStore.id,
        },
      });
    }

    console.log('✅ Sample products added');
    console.log('🎉 Setup completed successfully!');
    console.log('User can now login and access their own store data.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRugvedaStore();
