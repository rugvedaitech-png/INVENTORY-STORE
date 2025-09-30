import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'rugvedaitech@GMAIL.COM' },
      include: { 
        store: true,
        stores: true 
      }
    });
    
    if (user) {
      console.log('User found:', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        storeId: user.storeId,
        hasStore: !!user.store,
        storesCount: user.stores?.length || 0
      });
      
      if (user.store) {
        console.log('Store details:', {
          id: user.store.id,
          name: user.store.name,
          slug: user.store.slug,
          ownerId: user.store.ownerId
        });
      }
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
