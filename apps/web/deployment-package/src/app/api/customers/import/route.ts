import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Forbidden - Store owner access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 })
    }

    // Verify store ownership
    const store = await db.store.findFirst({
      where: { id: parseInt(storeId), ownerId: parseInt(session.user.id) },
    })
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 })
    }

    const csvContent = await file.text()
    const lines = csvContent.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must have header and at least one data row' }, { status: 400 })
    }

    // Parse CSV headers
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
    const requiredHeaders = ['name', 'email', 'phone']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        error: `Missing required columns: ${missingHeaders.join(', ')}. Required: ${requiredHeaders.join(', ')}` 
      }, { status: 400 })
    }

    // Parse data rows
    const dataRows = lines.slice(1)
    const results = {
      success: 0,
      errors: [] as string[],
      skipped: 0
    }

    for (let i = 0; i < dataRows.length; i++) {
      try {
        const row = dataRows[i]
        const values = row.split(',').map(v => v.replace(/"/g, '').trim())
        
        if (values.length !== headers.length) {
          results.errors.push(`Row ${i + 2}: Column count mismatch`)
          continue
        }

        const rowData: any = {}
        headers.forEach((header, index) => {
          rowData[header] = values[index]
        })

        // Validate required fields
        if (!rowData.name || !rowData.email || !rowData.phone) {
          results.errors.push(`Row ${i + 2}: Missing required fields (name, email, phone)`)
          continue
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rowData.email)) {
          results.errors.push(`Row ${i + 2}: Invalid email format`)
          continue
        }

        // Validate phone format
        if (!/^[\+]?[1-9][\d]{0,15}$/.test(rowData.phone.replace(/\s/g, ''))) {
          results.errors.push(`Row ${i + 2}: Invalid phone format`)
          continue
        }

        // Check if customer already exists
        const existingCustomer = await db.customer.findFirst({
          where: {
            storeId: parseInt(storeId),
            OR: [
              { email: rowData.email.toLowerCase() },
              { phone: rowData.phone.replace(/\s/g, '') }
            ]
          }
        })

        if (existingCustomer) {
          results.skipped++
          continue
        }

        // Create customer
        await db.customer.create({
          data: {
            name: rowData.name.trim(),
            email: rowData.email.toLowerCase().trim(),
            phone: rowData.phone.replace(/\s/g, ''),
            address: rowData.address ? rowData.address.trim() : null,
            storeId: parseInt(storeId)
          }
        })

        results.success++

      } catch (error) {
        results.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      message: `Import completed. ${results.success} customers imported, ${results.skipped} skipped (duplicates), ${results.errors.length} errors.`,
      results
    })

  } catch (error) {
    console.error('Error importing customers:', error)
    return NextResponse.json({ error: 'Failed to import customers' }, { status: 500 })
  }
}
