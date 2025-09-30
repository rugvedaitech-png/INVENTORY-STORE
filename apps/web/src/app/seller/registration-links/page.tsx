'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Store {
  id: number
  name: string
  slug: string
}

interface RegistrationLinks {
  store: Store
  links: {
    customer: string
    supplier: string
  }
}

export default function RegistrationLinksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<number | null>(null)
  const [registrationLinks, setRegistrationLinks] = useState<RegistrationLinks | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Redirect if not authenticated or not store owner
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/login')
      return
    }
    if (session.user.role !== 'STORE_OWNER') {
      router.push('/unauthorized')
      return
    }
  }, [session, status, router])

  // Fetch user's stores
  const fetchStores = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stores')
      if (!response.ok) throw new Error('Failed to fetch stores')
      
      const data = await response.json()
      setStores(data.stores)
      if (data.stores.length > 0) {
        setSelectedStore(data.stores[0].id)
      }
    } catch (error) {
      console.error('Error fetching stores:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch registration links for selected store
  const fetchRegistrationLinks = useCallback(async (storeSlug: string) => {
    try {
      const response = await fetch(`/api/stores/${storeSlug}/registration-links`)
      if (!response.ok) throw new Error('Failed to fetch registration links')
      
      const data = await response.json()
      setRegistrationLinks(data)
    } catch (error) {
      console.error('Error fetching registration links:', error)
    }
  }, [])

  useEffect(() => {
    if (session?.user?.role === 'STORE_OWNER') {
      fetchStores()
    }
  }, [session, fetchStores])

  useEffect(() => {
    if (selectedStore) {
      const store = stores.find(s => s.id === selectedStore)
      if (store) {
        fetchRegistrationLinks(store.slug)
      }
    }
  }, [selectedStore, stores, fetchRegistrationLinks])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const generateNewLink = async (role: 'CUSTOMER' | 'SUPPLIER') => {
    if (!selectedStore) return

    const store = stores.find(s => s.id === selectedStore)
    if (!store) return

    try {
      setGenerating(true)
      const response = await fetch(`/api/stores/${store.slug}/registration-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, expiresInDays: 7 })
      })

      if (!response.ok) throw new Error('Failed to generate link')
      
      const data = await response.json()
      
      // Update the links
      setRegistrationLinks(prev => prev ? {
        ...prev,
        links: {
          ...prev.links,
          [role.toLowerCase()]: data.link
        }
      } : null)
    } catch (error) {
      console.error('Error generating link:', error)
      alert('Failed to generate new link')
    } finally {
      setGenerating(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Registration Links</h1>
            <p className="text-gray-600">Generate registration links for customers and suppliers</p>
          </div>

          {/* Store Selection */}
          {stores.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Store
              </label>
              <select
                value={selectedStore || ''}
                onChange={(e) => setSelectedStore(parseInt(e.target.value))}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Registration Links */}
          {registrationLinks && (
            <div className="space-y-6">
              {/* Customer Registration Link */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Customer Registration</h3>
                  <button
                    onClick={() => generateNewLink('CUSTOMER')}
                    disabled={generating}
                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {generating ? 'Generating...' : 'Generate New'}
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration Link
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={registrationLinks.links.customer}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(registrationLinks.links.customer)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-r-md hover:bg-gray-700 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Share this link with customers to allow them to register for your store.
                  </p>
                </div>
              </div>

              {/* Supplier Registration Link */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Supplier Registration</h3>
                  <button
                    onClick={() => generateNewLink('SUPPLIER')}
                    disabled={generating}
                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {generating ? 'Generating...' : 'Generate New'}
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration Link
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={registrationLinks.links.supplier}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(registrationLinks.links.supplier)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-r-md hover:bg-gray-700 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Share this link with suppliers to allow them to register for your store.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">How to Use Registration Links</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>1. Generate Links:</strong> Select your store and generate registration links for customers and suppliers.</p>
              <p><strong>2. Share Links:</strong> Send the appropriate link to customers or suppliers via email, WhatsApp, or any other method.</p>
              <p><strong>3. Registration:</strong> When users click the link, they&apos;ll be taken to a registration page pre-filled with your store information.</p>
              <p><strong>4. Automatic Association:</strong> Users who register through these links will be automatically associated with your store.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
