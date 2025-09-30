'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Supplier {
  id: number
  name: string
  email: string | null
}

export default function LinkSupplierPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/login')
      return
    }
    if (session.user.role !== 'SUPPLIER') {
      router.push('/unauthorized')
      return
    }
    fetchSuppliers()
  }, [session, status, router])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/link-supplier')
      if (!response.ok) throw new Error('Failed to fetch suppliers')
      
      const data = await response.json()
      setSuppliers(data.suppliers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suppliers')
    } finally {
      setLoading(false)
    }
  }

  const linkSupplier = async (supplierId: number) => {
    try {
      setLinking(true)
      setError(null)
      
      const response = await fetch('/api/link-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to link supplier')
      }

      // Redirect to dashboard
      router.push('/supplier')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link supplier')
    } finally {
      setLinking(false)
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
      <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Link Your Supplier Account
              </h1>
              <p className="text-gray-600 mb-6">
                Please select the supplier account that matches your business to access the supplier dashboard.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              {suppliers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No unlinked suppliers found. Please contact the store owner to create a supplier account for you.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suppliers.map((supplier) => (
                    <div key={supplier.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {supplier.name}
                          </h3>
                          {supplier.email && (
                            <p className="text-sm text-gray-500">
                              {supplier.email}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => linkSupplier(supplier.id)}
                          disabled={linking}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {linking ? 'Linking...' : 'Link Account'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
