'use client'

import { useState, useEffect } from 'react'
import { DocumentTextIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface Store {
  id: number
  name: string
  slug: string
  whatsapp: string | null
  upiId: string | null
  address: string | null
  gstin: string | null
  currency: string
  billLayout: 'VERTICAL' | 'REGULAR'
}

export default function StoreSettings() {
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [billLayout, setBillLayout] = useState<'VERTICAL' | 'REGULAR'>('REGULAR')
  const [address, setAddress] = useState<string>('')
  const [gstin, setGstin] = useState<string>('')

  useEffect(() => {
    fetchStore()
  }, [])

  const fetchStore = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stores')
      if (!response.ok) {
        throw new Error('Failed to fetch store')
      }
      const data = await response.json()
      if (data.stores && data.stores.length > 0) {
        const storeData = data.stores[0]
        setStore(storeData)
        setBillLayout(storeData.billLayout || 'REGULAR')
        setAddress(storeData.address || '')
        setGstin(storeData.gstin || '')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch store')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!store) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const response = await fetch(`/api/stores/${store.slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billLayout,
          address: address || null,
          gstin: gstin || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        // Show detailed validation errors if available
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((err: any) => err.message).join(', ')
          throw new Error(errorMessages || errorData.error || 'Failed to update store settings')
        }
        throw new Error(errorData.error || 'Failed to update store settings')
      }

      const data = await response.json()
      setStore(data.store)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update store settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading store settings...</p>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No store found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Store Address Setting */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Store Address
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Enter your store address to display on bills and invoices. You can use multiple lines.
        </p>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={4}
          placeholder="Enter store address&#10;Line 1&#10;Line 2, City - PIN Code"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* GSTIN Setting */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          GSTIN (GST Identification Number)
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Enter your 15-character GST Identification Number. This will be displayed on all invoices and bills.
        </p>
        <input
          type="text"
          value={gstin}
          onChange={(e) => setGstin(e.target.value.toUpperCase())}
          placeholder="e.g., 27AABCU9603R1ZX"
          maxLength={15}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
        />
        <p className="text-xs text-gray-400 mt-1">Format: 15 characters (2 state code + 10 PAN + 3 entity number + 1 check digit)</p>
      </div>

      {/* Bill Layout Setting */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <DocumentTextIcon className="h-5 w-5 inline mr-2" />
          Bill Layout
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Choose the default bill layout for your store receipts
        </p>
        
        <div className="space-y-3">
          <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="billLayout"
              value="REGULAR"
              checked={billLayout === 'REGULAR'}
              onChange={(e) => setBillLayout(e.target.value as 'REGULAR')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div className="ml-3 flex-1">
              <div className="text-sm font-medium text-gray-900">Regular Invoice Format</div>
              <div className="text-sm text-gray-500">
                Standard horizontal invoice layout with detailed item listing
              </div>
            </div>
          </label>

          <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="billLayout"
              value="VERTICAL"
              checked={billLayout === 'VERTICAL'}
              onChange={(e) => setBillLayout(e.target.value as 'VERTICAL')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div className="ml-3 flex-1">
              <div className="text-sm font-medium text-gray-900">Vertical Bill Layout</div>
              <div className="text-sm text-gray-500">
                Compact vertical layout optimized for thermal printers
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <XCircleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
          <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-green-800 text-sm">Store settings updated successfully!</p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || (billLayout === store.billLayout && address === (store.address || '') && gstin === (store.gstin || ''))}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

