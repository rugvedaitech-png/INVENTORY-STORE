import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
    await prisma.category.create({
      data: {
        ...categoryData,
        storeId: storeId,
        slug: slug,
      },
    })
  }
}

async function main() {
  try {
    console.log('🌱 Adding ration store categories to all stores...')

    // Get all stores
    const stores = await prisma.store.findMany({
      include: {
        categories: true
      }
    })

    console.log(`Found ${stores.length} stores`)

    for (const store of stores) {
      if (store.categories.length === 0) {
        console.log(`Adding categories to store: ${store.name}`)
        await addRationStoreCategories(store.id)
        console.log(`✅ Added categories to ${store.name}`)
      } else {
        console.log(`⏭️  Store ${store.name} already has ${store.categories.length} categories`)
      }
    }

    console.log('✅ Category addition completed!')
  } catch (error) {
    console.error('❌ Error adding categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
