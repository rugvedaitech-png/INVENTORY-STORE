import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-service'
import { db } from '@/lib/db'

// Temporary fix for UserRole import issue
enum UserRole {
  STORE_OWNER = 'STORE_OWNER',
  SUPPLIER = 'SUPPLIER',
  CUSTOMER = 'CUSTOMER'
}

// Function to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Function to add common ration store categories
async function addRationStoreCategories(storeId: number) {
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
    const slug = createSlug(categoryData.name)
    await db.category.create({
      data: {
        ...categoryData,
        storeId: storeId,
        slug: slug,
      },
    })
  }
}

// Function to add sample products to a new store
async function addSampleProductsToStore(storeId: number) {
  // First, get the categories for this store
  const categories = await db.category.findMany({
    where: { storeId },
    orderBy: { sortOrder: 'asc' }
  })

  const sampleProducts = [
    {
      title: 'Basmati Rice (1kg)',
      description: 'Premium quality basmati rice, perfect for daily consumption',
      sku: 'RICE-001',
      price: 12000, // ₹120.00
      costPrice: 10000, // ₹100.00
      stock: 50,
      reorderPoint: 10,
      reorderQty: 100,
      images: JSON.stringify(['https://picsum.photos/400/400?random=1']),
      active: true,
      categoryId: categories.find(c => c.name === 'Rice & Grains')?.id,
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
      images: JSON.stringify(['https://picsum.photos/400/400?random=2']),
      active: true,
      categoryId: categories.find(c => c.name === 'Flour & Atta')?.id,
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
      images: JSON.stringify(['https://picsum.photos/400/400?random=3']),
      active: true,
      categoryId: categories.find(c => c.name === 'Pulses & Lentils')?.id,
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
      images: JSON.stringify(['https://picsum.photos/400/400?random=4']),
      active: true,
      categoryId: categories.find(c => c.name === 'Cooking Oil')?.id,
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
      images: JSON.stringify(['https://picsum.photos/400/400?random=5']),
      active: true,
      categoryId: categories.find(c => c.name === 'Sugar & Sweeteners')?.id,
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
      images: JSON.stringify(['https://picsum.photos/400/400?random=6']),
      active: true,
      categoryId: categories.find(c => c.name === 'Salt & Spices')?.id,
    },
  ]

  for (const productData of sampleProducts) {
    await db.product.create({
      data: {
        ...productData,
        storeId: storeId,
      },
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password, role, storeSlug, storeName, storeWhatsapp, storeUpiId } = await request.json()

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    let storeId = null

    // If storeSlug is provided, find the store and set storeId
    if (storeSlug) {
      const store = await db.store.findUnique({
        where: { slug: storeSlug }
      })

      if (!store) {
        return NextResponse.json(
          { error: 'Store not found' },
          { status: 404 }
        )
      }

      storeId = store.id
    }

    let pendingStoreData:
      | {
          name: string
          slug: string
          whatsapp: string | null
          upiId: string | null
          currency: string
        }
      | null = null

    // For store owners, prepare a new store if no storeSlug provided
    if (role === UserRole.STORE_OWNER && !storeId) {
      if (!storeName) {
        return NextResponse.json(
          { error: 'Store name is required for store owners' },
          { status: 400 }
        )
      }

      pendingStoreData = {
        name: storeName,
        slug: storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        whatsapp: storeWhatsapp || null,
        upiId: storeUpiId || null,
        currency: 'INR',
      }
    }

    // For customers and suppliers, storeId is required
    if ((role === UserRole.CUSTOMER || role === UserRole.SUPPLIER) && !storeId) {
      return NextResponse.json(
        { error: 'Store association required for customers and suppliers' },
        { status: 400 }
      )
    }

    // Use AuthService to register user
    const user = await AuthService.register({
      name,
      email,
      phone: phone || null,
      password,
      role: role as UserRole,
      storeId
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to register user' },
        { status: 500 }
      )
    }

    // If this is a store owner, update the store with the ownerId
    if (role === UserRole.STORE_OWNER) {
      let ownerStoreId = storeId

      if (!ownerStoreId && pendingStoreData) {
        const store = await db.store.create({
          data: {
            ...pendingStoreData,
            ownerId: user.id,
          },
        })

        ownerStoreId = store.id

        await db.user.update({
          where: { id: user.id },
          data: { storeId: ownerStoreId },
        })
      } else if (ownerStoreId) {
        await db.store.update({
          where: { id: ownerStoreId },
          data: { ownerId: user.id },
        })
      }

      if (ownerStoreId) {
        // Add ration store categories first
        await addRationStoreCategories(ownerStoreId)

        // Then add sample products to the new store
        await addSampleProductsToStore(ownerStoreId)
      }
    }

    return NextResponse.json(
      { 
        message: 'User created successfully', 
        userId: user.id,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          storeId: user.storeId
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
