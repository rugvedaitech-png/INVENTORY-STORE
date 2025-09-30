const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserStore() {
  try {
    console.log('🔍 Looking for user: rugvedaitech@GMAIL.COM');
    
    // Find the existing user
    const user = await prisma.user.findUnique({
      where: { email: 'rugvedaitech@GMAIL.COM' }
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
      storeId: user.storeId
    });

    // Check if user already has a store
    if (user.storeId) {
      const existingStore = await prisma.store.findUnique({
        where: { id: user.storeId }
      });
      
      if (existingStore) {
        console.log('ℹ️  User already has a store:', {
          id: existingStore.id,
          name: existingStore.name,
          slug: existingStore.slug
        });
        return;
      }
    }

    console.log('🏪 Creating store for user...');
    
    // Create store for this user
    const store = await prisma.store.create({
      data: {
        name: 'Rugveda Itech Store',
        slug: 'rugveda-itech-store',
        whatsapp: '919876543210',
        upiId: 'rugveda@upi',
        currency: 'INR',
        ownerId: user.id
      }
    });

    console.log('✅ Store created:', {
      id: store.id,
      name: store.name,
      slug: store.slug,
      ownerId: store.ownerId
    });

    // Update user with storeId
    await prisma.user.update({
      where: { id: user.id },
      data: { storeId: store.id }
    });

    console.log('✅ User updated with storeId:', store.id);
    console.log('🎉 Setup completed! User can now access store data.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserStore();
