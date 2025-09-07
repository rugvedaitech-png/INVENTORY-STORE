import { describe, it, expect, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Inventory Rules', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.stockLedger.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.purchaseOrderItem.deleteMany()
    await prisma.purchaseOrder.deleteMany()
    await prisma.product.deleteMany()
    await prisma.supplier.deleteMany()
    await prisma.store.deleteMany()
    await prisma.user.deleteMany()
  })

  it('should prevent negative stock on sale', async () => {
    // Create test data
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    })

    const store = await prisma.store.create({
      data: {
        ownerId: user.id,
        name: 'Test Store',
        slug: 'test-store',
        currency: 'INR',
      },
    })

    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        title: 'Test Product',
        price: 1000, // ₹10.00
        stock: 5,
        active: true,
      },
    })

    // Try to create order with quantity > stock
    const orderData = {
      buyerName: 'Test Customer',
      phone: '9876543210',
      address: 'Test Address',
      paymentMethod: 'COD' as const,
      items: [
        {
          productId: product.id,
          qty: 10, // More than available stock (5)
        },
      ],
    }

    // This should fail due to insufficient stock
    await expect(async () => {
      await fetch('/api/orders?store=test-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })
    }).rejects.toThrow()
  })

  it('should update moving average cost on partial receipt', async () => {
    // Create test data
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    })

    const store = await prisma.store.create({
      data: {
        ownerId: user.id,
        name: 'Test Store',
        slug: 'test-store',
        currency: 'INR',
      },
    })

    const supplier = await prisma.supplier.create({
      data: {
        storeId: store.id,
        name: 'Test Supplier',
        leadTimeDays: 3,
      },
    })

    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        title: 'Test Product',
        price: 1000, // ₹10.00
        costPrice: 500, // ₹5.00
        stock: 10,
        active: true,
      },
    })

    // Create purchase order
    const po = await prisma.purchaseOrder.create({
      data: {
        storeId: store.id,
        supplierId: supplier.id,
        code: 'PO-TEST-001',
        status: 'SENT',
        subtotal: 2000, // ₹20.00
        total: 2000,
        items: {
          create: {
            productId: product.id,
            qty: 4,
            costPaise: 600, // ₹6.00 per unit
          },
        },
      },
    })

    // Receive partial shipment (2 out of 4)
    const receiveData = {
      items: [
        {
          itemId: po.items[0].id,
          receivedQty: 2,
        },
      ],
    }

    // Calculate expected moving average cost
    // Old: 10 units × ₹5.00 = ₹50.00
    // New: 2 units × ₹6.00 = ₹12.00
    // Total: ₹62.00 ÷ 12 units = ₹5.17 (rounded to 517 paise)
    const expectedCost = Math.round(((10 * 500) + (2 * 600)) / 12)

    // Process receiving
    await fetch(`/api/purchase-orders/${po.id}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(receiveData),
    })

    // Verify updated product
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
    })

    expect(updatedProduct?.stock).toBe(12) // 10 + 2
    expect(updatedProduct?.costPrice).toBe(expectedCost)

    // Verify stock ledger entry
    const ledgerEntry = await prisma.stockLedger.findFirst({
      where: {
        productId: product.id,
        refType: 'PO_RECEIPT',
      },
    })

    expect(ledgerEntry?.delta).toBe(2)
    expect(ledgerEntry?.unitCost).toBe(600)
  })

  it('should update PO status correctly on partial receipt', async () => {
    // Create test data
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    })

    const store = await prisma.store.create({
      data: {
        ownerId: user.id,
        name: 'Test Store',
        slug: 'test-store',
        currency: 'INR',
      },
    })

    const supplier = await prisma.supplier.create({
      data: {
        storeId: store.id,
        name: 'Test Supplier',
        leadTimeDays: 3,
      },
    })

    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        title: 'Test Product',
        price: 1000,
        stock: 10,
        active: true,
      },
    })

    // Create purchase order
    const po = await prisma.purchaseOrder.create({
      data: {
        storeId: store.id,
        supplierId: supplier.id,
        code: 'PO-TEST-002',
        status: 'SENT',
        subtotal: 2000,
        total: 2000,
        items: {
          create: {
            productId: product.id,
            qty: 4,
            costPaise: 600,
          },
        },
      },
    })

    // Receive partial shipment
    const receiveData = {
      items: [
        {
          itemId: po.items[0].id,
          receivedQty: 2,
        },
      ],
    }

    await fetch(`/api/purchase-orders/${po.id}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(receiveData),
    })

    // Verify PO status is PARTIAL
    const updatedPO = await prisma.purchaseOrder.findUnique({
      where: { id: po.id },
    })

    expect(updatedPO?.status).toBe('PARTIAL')
  })
})

