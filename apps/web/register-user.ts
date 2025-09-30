import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function registerUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'rugvedaitech@GMAIL.COM' }
    });

    if (existingUser) {
      console.log('User already exists:', {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
        storeId: existingUser.storeId
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: 'rugvedaitech@GMAIL.COM',
        name: 'Rugveda Itech',
        password: hashedPassword,
        role: 'STORE_OWNER',
        phone: '919876543210'
      }
    });

    console.log('User created:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

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

    console.log('Store created:', {
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

    console.log('User updated with storeId:', store.id);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

registerUser();
