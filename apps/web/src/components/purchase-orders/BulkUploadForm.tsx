'use client'

import { useState, useRef } from 'react'
import {
  XMarkIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface BulkUploadItem {
  category: string
  sku: string
  title: string
  quantity: number
  unitCost: number
  description?: string
  price?: number
}

interface BulkUploadFormProps {
  suppliers: Array<{ id: number; name: string }>
  onSuccess: () => void
  onClose: () => void
}

export default function BulkUploadForm({ suppliers, onSuccess, onClose }: BulkUploadFormProps) {
  const [supplierId, setSupplierId] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [items, setItems] = useState<BulkUploadItem[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      setUploadError('Please upload a CSV or Excel file')
      return
    }

    setFile(selectedFile)
    setUploadError(null)
    parseFile(selectedFile)
  }

  // Simple CSV parser that handles quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"'
          i++ // Skip next quote
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const parseFile = async (file: File) => {
    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter(line => line.trim())
      
      if (lines.length < 2) {
        setUploadError('File must contain at least a header row and one data row')
        return
      }

      // Parse CSV headers
      const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/"/g, ''))
      const requiredHeaders = ['category', 'sku', 'title', 'quantity', 'unitcost']
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
      
      if (missingHeaders.length > 0) {
        setUploadError(`Missing required columns: ${missingHeaders.join(', ')}. Found: ${headers.join(', ')}`)
        return
      }

      const parsedItems: BulkUploadItem[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim())
        if (values.length < requiredHeaders.length) continue

        const categoryIndex = headers.indexOf('category')
        const skuIndex = headers.indexOf('sku')
        const titleIndex = headers.indexOf('title')
        const quantityIndex = headers.indexOf('quantity')
        const unitCostIndex = headers.indexOf('unitcost')
        const descriptionIndex = headers.indexOf('description')
        const priceIndex = headers.indexOf('price')

        const item: BulkUploadItem = {
          category: values[categoryIndex] || '',
          sku: values[skuIndex] || '',
          title: values[titleIndex] || '',
          quantity: parseInt(values[quantityIndex] || '0', 10),
          unitCost: Math.round(parseFloat(values[unitCostIndex] || '0') * 100), // Convert to paise
          description: descriptionIndex >= 0 ? values[descriptionIndex] : undefined,
          price: priceIndex >= 0 ? Math.round(parseFloat(values[priceIndex] || '0') * 100) : undefined,
        }

        // Validate item
        if (!item.category || !item.sku || !item.title || item.quantity <= 0 || item.unitCost < 0) {
          continue // Skip invalid rows
        }

        parsedItems.push(item)
      }

      if (parsedItems.length === 0) {
        setUploadError('No valid items found in file')
        return
      }

      setItems(parsedItems)
      setUploadError(null)
    } catch (error) {
      setUploadError('Error parsing file. Please check the format.')
      console.error('File parsing error:', error)
    }
  }

  const handleItemChange = (index: number, field: keyof BulkUploadItem, value: string | number) => {
    const updatedItems = [...items]
    if (field === 'unitCost' || field === 'price') {
      updatedItems[index][field] = Math.round(Number(value) * 100) as number
    } else if (field === 'quantity') {
      updatedItems[index][field] = Number(value) as number
    } else {
      updatedItems[index][field] = value as string
    }
    setItems(updatedItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setUploadError(null)
    setSuccess(null)

    // Validation
    if (!supplierId) {
      setErrors({ supplierId: 'Please select a supplier' })
      return
    }

    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      setErrors({ totalAmount: 'Please enter a valid total amount' })
      return
    }

    if (items.length === 0) {
      setUploadError('Please upload a file with product data')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/purchase-orders/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplierId: parseInt(supplierId, 10),
          totalAmount: Math.round(parseFloat(totalAmount) * 100), // Convert to paise
          notes: notes.trim() || undefined,
          items: items.map(item => ({
            category: item.category.trim(),
            sku: item.sku.trim(),
            title: item.title.trim(),
            quantity: item.quantity,
            unitCost: item.unitCost,
            description: item.description?.trim(),
            price: item.price,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process bulk upload')
      }

      setSuccess(
        `Successfully uploaded ${data.summary.totalItems} items. ` +
        `Created ${data.summary.createdProducts} new products, ` +
        `updated ${data.summary.existingProducts} existing products.`
      )

      // Reset form after 2 seconds
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to process bulk upload')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Bulk Upload Offline Products</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Supplier Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.supplierId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {errors.supplierId && (
                  <p className="mt-1 text-sm text-red-600">{errors.supplierId}</p>
                )}
              </div>

              {/* Total Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount Paid (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.totalAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.totalAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.totalAmount}</p>
                )}
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload CSV/Excel File <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      CSV or Excel file with columns: Category, SKU, Title, Quantity, UnitCost (optional: Description, Price)
                    </p>
                    {file && (
                      <p className="text-sm text-gray-900 mt-2">{file.name}</p>
                    )}
                  </div>
                </div>
                {uploadError && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <XCircleIcon className="h-5 w-5 mr-1" />
                    {uploadError}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Notes (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      // Create sample CSV content
                      const sampleCSV = `Category,SKU,Title,Quantity,UnitCost,Description,Price
Electronics,ELEC001,LED Bulb 10W,50,150.00,Energy efficient LED bulb,225.00
Electronics,ELEC002,USB Cable Type-C,100,50.00,USB-A to USB-C cable,75.00
Groceries,GROC001,Rice 5kg,20,250.00,Premium basmati rice,375.00
Groceries,GROC002,Wheat Flour 2kg,30,80.00,Whole wheat flour,120.00
Stationery,STAT001,Notebook A4,75,25.00,Spiral bound notebook,37.50
Stationery,STAT002,Ball Pen Blue,200,5.00,Blue ink ball pen,7.50`
                      
                      // Create blob and download
                      const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8;' })
                      const link = document.createElement('a')
                      const url = URL.createObjectURL(blob)
                      link.setAttribute('href', url)
                      link.setAttribute('download', 'bulk-upload-sample.csv')
                      link.style.visibility = 'hidden'
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                  >
                    <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                    Download Sample CSV
                  </button>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Additional notes about this purchase..."
                />
              </div>

              {/* Items Preview */}
              {items.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Items Preview ({items.length} items)
                  </label>
                  <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm">{item.category}</td>
                            <td className="px-3 py-2 text-sm">{item.sku}</td>
                            <td className="px-3 py-2 text-sm">{item.title}</td>
                            <td className="px-3 py-2 text-sm">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded"
                                min="1"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <input
                                type="number"
                                step="0.01"
                                value={(item.unitCost / 100).toFixed(2)}
                                onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded"
                                min="0"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm">
                              ₹{((item.quantity * item.unitCost) / 100).toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Total: ₹{(items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0) / 100).toFixed(2)}
                  </p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}

              {/* Error Message */}
              {uploadError && !success && (
                <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-sm text-red-800">{uploadError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || items.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Processing...' : 'Upload & Create Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

