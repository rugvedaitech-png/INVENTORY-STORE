import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { parse } from 'csv-parse/sync'

// Schema for CSV row validation
const csvProductSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.string().transform((val) => {
    const num = parseFloat(val)
    if (isNaN(num) || num < 0) throw new Error('Invalid price')
    return Math.round(num * 100) // Convert to paise
  }),
  costPrice: z.string().optional().transform((val) => {
    if (!val) return null
    const num = parseFloat(val)
    if (isNaN(num) || num < 0) throw new Error('Invalid cost price')
    return Math.round(num * 100) // Convert to paise
  }),
  stock: z.string().transform((val) => {
    const num = parseInt(val)
    if (isNaN(num) || num < 0) throw new Error('Invalid stock')
    return num
  }),
  reorderPoint: z.string().optional().transform((val) => {
    if (!val) return 0
    const num = parseInt(val)
    if (isNaN(num) || num < 0) throw new Error('Invalid reorder point')
    return num
  }),
  reorderQty: z.string().optional().transform((val) => {
    if (!val) return 0
    const num = parseInt(val)
    if (isNaN(num) || num < 0) throw new Error('Invalid reorder quantity')
    return num
  }),
  categoryName: z.string().optional(),
  images: z.string().optional().transform((val) => {
    if (!val) return '[]'
    try {
      // If it's a JSON string, validate it
      const parsed = JSON.parse(val)
      return JSON.stringify(Array.isArray(parsed) ? parsed : [])
    } catch {
      // If it's a comma-separated string, convert to JSON array
      const urls = val.split(',').map(url => url.trim()).filter(url => url)
      return JSON.stringify(urls)
    }
  }),
  active: z.string().optional().transform((val) => {
    if (!val) return true
    return val.toLowerCase() === 'true' || val.toLowerCase() === '1' || val.toLowerCase() === 'yes'
  })
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the user's store
    const store = await db.store.findFirst({
      where: { ownerId: parseInt(session.user.id) }
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found for this user' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const allowedCategoryIds = formData.get('allowedCategoryIds') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 })
    }

    // Parse allowed category IDs
    let allowedCategories: number[] = []
    if (allowedCategoryIds) {
      try {
        allowedCategories = JSON.parse(allowedCategoryIds)
        if (!Array.isArray(allowedCategories)) {
          return NextResponse.json({ error: 'Invalid category filter format' }, { status: 400 })
        }
      } catch {
        return NextResponse.json({ error: 'Invalid category filter format' }, { status: 400 })
      }
    }

    // Read and parse CSV
    const csvContent = await file.text()
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    if (records.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 })
    }

    // Validate required columns
    const requiredColumns = ['title', 'price', 'stock']
    const csvColumns = Object.keys(records[0])
    const missingColumns = requiredColumns.filter(col => !csvColumns.includes(col))
    
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `Missing required columns: ${missingColumns.join(', ')}` 
      }, { status: 400 })
    }

    // Get all categories for mapping
    const categories = await db.category.findMany({
      where: { 
        storeId: store.id, 
        active: true,
        ...(allowedCategories.length > 0 && { id: { in: allowedCategories } })
      }
    })
    const categoryMap = new Map(categories.map(cat => [cat.name.toLowerCase(), cat.id]))
    
    // If category filtering is enabled, validate that all allowed categories exist
    if (allowedCategories.length > 0) {
      const foundCategoryIds = categories.map(cat => cat.id)
      const missingCategories = allowedCategories.filter(id => !foundCategoryIds.includes(id))
      if (missingCategories.length > 0) {
        return NextResponse.json({ 
          error: `Invalid category IDs: ${missingCategories.join(', ')}` 
        }, { status: 400 })
      }
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number, error: string, data: any }>
    }

    // Process each row
    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      const rowNumber = i + 2 // +2 because CSV is 1-indexed and we skip header

      try {
        // Validate and transform the row data
        const validatedData = csvProductSchema.parse(row)

        // Map category name to ID
        let categoryId = null
        if (validatedData.categoryName) {
          const categoryIdFromName = categoryMap.get(validatedData.categoryName.toLowerCase())
          if (categoryIdFromName) {
            categoryId = categoryIdFromName
          } else {
            // If category filtering is enabled, don't create new categories
            if (allowedCategories.length > 0) {
              throw new Error(`Category "${validatedData.categoryName}" is not in the allowed categories list`)
            }
            
            // Create new category if it doesn't exist and no filtering is enabled
            const newCategory = await db.category.create({
              data: {
                name: validatedData.categoryName,
                slug: validatedData.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                storeId: store.id,
                active: true
              }
            })
            categoryId = newCategory.id
            categoryMap.set(validatedData.categoryName.toLowerCase(), newCategory.id)
          }
        }
        
        // If category filtering is enabled and no category is specified, reject the product
        if (allowedCategories.length > 0 && !categoryId) {
          throw new Error('Product must belong to one of the allowed categories')
        }

        // Create the product
        await db.product.create({
          data: {
            title: validatedData.title,
            description: validatedData.description || null,
            sku: validatedData.sku || null,
            price: validatedData.price,
            costPrice: validatedData.costPrice,
            stock: validatedData.stock,
            reorderPoint: validatedData.reorderPoint,
            reorderQty: validatedData.reorderQty,
            categoryId,
            images: validatedData.images,
            active: validatedData.active,
            storeId: store.id
          }
        })

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: row
        })
      }
    }

    return NextResponse.json({
      message: `Bulk upload completed. ${results.success} products created, ${results.failed} failed.`,
      results
    })

  } catch (error) {
    console.error('Error in bulk upload:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk upload' },
      { status: 500 }
    )
  }
}

// GET endpoint to download sample CSV
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const allowedCategoryIds = searchParams.get('allowedCategoryIds')
  // Get session to fetch available categories if filtering is enabled
  let availableCategories: Array<{ id: number, name: string }> = []
  
  if (allowedCategoryIds) {
    try {
      const session = await getServerSession(authOptions)
      if (session?.user?.id) {
        const store = await db.store.findFirst({
          where: { ownerId: parseInt(session.user.id) }
        })
        
        if (store) {
          const categoryIds = JSON.parse(allowedCategoryIds)
          availableCategories = await db.category.findMany({
            where: { 
              id: { in: categoryIds },
              storeId: store.id,
              active: true 
            },
            select: { id: true, name: true }
          })
        }
      }
    } catch (error) {
      console.error('Error fetching categories for sample:', error)
    }
  }

  const sampleData = [
    {
      title: 'Sample Product 1',
      description: 'This is a sample product description',
      sku: 'SKU001',
      price: '99.99',
      costPrice: '50.00',
      stock: '100',
      reorderPoint: '10',
      reorderQty: '50',
      categoryName: availableCategories.length > 0 ? availableCategories[0].name : 'Electronics',
      images: '["https://example.com/image1.jpg", "https://example.com/image2.jpg"]',
      active: 'true'
    },
    {
      title: 'Sample Product 2',
      description: 'Another sample product',
      sku: 'SKU002',
      price: '149.50',
      costPrice: '75.00',
      stock: '50',
      reorderPoint: '5',
      reorderQty: '25',
      categoryName: availableCategories.length > 1 ? availableCategories[1].name : (availableCategories.length > 0 ? availableCategories[0].name : 'Clothing'),
      images: 'https://example.com/image3.jpg,https://example.com/image4.jpg',
      active: 'true'
    }
  ]

  // Convert to CSV format
  const headers = Object.keys(sampleData[0])
  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => 
      headers.map(header => {
        const value = row[header as keyof typeof row]
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="products_sample.csv"'
    }
  })
}
