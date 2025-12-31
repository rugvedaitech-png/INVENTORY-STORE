'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, decimalToNumber } from '@/lib/money'
import {
  ArrowPathIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  TruckIcon
} from '@heroicons/react/24/outline'

interface ReturnRequest {
  id: number
  orderId: number
  productId: number
  productName: string
  productImage: string
  reason: string
  description: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PICKED_UP' | 'PROCESSED' | 'REFUNDED'
  createdAt: string
  updatedAt: string
  refundAmount: number
  pickupDate?: string
  trackingNumber?: string
}

export default function ReturnsPage() {
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [editingReturn, setEditingReturn] = useState<ReturnRequest | null>(null)
  const [filter, setFilter] = useState('all')
  const [newReturn, setNewReturn] = useState({
    orderId: 0,
    productId: 0,
    productName: '',
    reason: '',
    description: ''
  })

  const returnReasons = [
    'Defective Product',
    'Wrong Item Received',
    'Item Not as Described',
    'Damaged in Transit',
    'Changed Mind',
    'Size/Color Not Suitable',
    'Quality Issues',
    'Other'
  ]

  useEffect(() => {
    fetchReturnRequests()
  }, [])

  const fetchReturnRequests = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockReturns: ReturnRequest[] = [
        {
          id: 1,
          orderId: 12345,
          productId: 1,
          productName: 'Basmati Rice (1kg)',
          productImage: '/uploads/products/rice.jpg',
          reason: 'Defective Product',
          description: 'The rice package was torn and some grains were spilled out.',
          status: 'PENDING',
          createdAt: '2025-01-12T10:30:00Z',
          updatedAt: '2025-01-12T10:30:00Z',
          refundAmount: 25000 // in paise
        },
        {
          id: 2,
          orderId: 12340,
          productId: 2,
          productName: 'Toor Dal (500g)',
          productImage: '/uploads/products/dal.jpg',
          reason: 'Wrong Item Received',
          description: 'I ordered Toor Dal but received Chana Dal instead.',
          status: 'APPROVED',
          createdAt: '2025-01-10T14:20:00Z',
          updatedAt: '2025-01-11T09:15:00Z',
          refundAmount: 18000,
          pickupDate: '2025-01-15T10:00:00Z',
          trackingNumber: 'RTN123456789'
        },
        {
          id: 3,
          orderId: 12335,
          productId: 3,
          productName: 'Cooking Oil (1L)',
          productImage: '/uploads/products/oil.jpg',
          reason: 'Item Not as Described',
          description: 'The oil quality is not as advertised. It has a strange smell.',
          status: 'REFUNDED',
          createdAt: '2025-01-08T16:45:00Z',
          updatedAt: '2025-01-12T11:30:00Z',
          refundAmount: 32000
        }
      ]
      setReturnRequests(mockReturns)
    } catch (error) {
      console.error('Error fetching return requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingReturn) {
        // Update existing return request
        const updatedRequest: ReturnRequest = {
          ...editingReturn,
          ...newReturn,
          productImage: editingReturn.productImage,
          createdAt: editingReturn.createdAt,
          updatedAt: new Date().toISOString(),
          status: editingReturn.status,
          refundAmount: editingReturn.refundAmount,
          pickupDate: editingReturn.pickupDate,
          trackingNumber: editingReturn.trackingNumber,
        }

        setReturnRequests(returnRequests.map(request =>
          request.id === editingReturn.id ? updatedRequest : request
        ))
      } else {
        // Add new return request
        const returnRequest: ReturnRequest = {
          ...newReturn,
          id: Date.now(),
          productImage: '/uploads/products/default.jpg',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'PENDING',
          refundAmount: 0 // Will be calculated by the system
        }
        setReturnRequests([returnRequest, ...returnRequests])
      }
      
      setShowReturnForm(false)
      setEditingReturn(null)
      setNewReturn({
        orderId: 0,
        productId: 0,
        productName: '',
        reason: '',
        description: ''
      })
    } catch (error) {
      console.error('Error saving return request:', error)
    }
  }

  const handleEdit = (returnRequest: ReturnRequest) => {
    setEditingReturn(returnRequest)
    setNewReturn({
      orderId: returnRequest.orderId,
      productId: returnRequest.productId,
      productName: returnRequest.productName,
      reason: returnRequest.reason,
      description: returnRequest.description
    })
    setShowReturnForm(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this return request?')) {
      setReturnRequests(returnRequests.filter(request => request.id !== id))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100'
      case 'APPROVED':
        return 'text-blue-600 bg-blue-100'
      case 'REJECTED':
        return 'text-red-600 bg-red-100'
      case 'PICKED_UP':
        return 'text-purple-600 bg-purple-100'
      case 'PROCESSED':
        return 'text-indigo-600 bg-indigo-100'
      case 'REFUNDED':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return ClockIcon
      case 'APPROVED':
        return CheckIcon
      case 'REJECTED':
        return XMarkIcon
      case 'PICKED_UP':
        return TruckIcon
      case 'PROCESSED':
        return ArrowPathIcon
      case 'REFUNDED':
        return CheckIcon
      default:
        return ClockIcon
    }
  }

  const filteredReturns = returnRequests.filter(request => {
    if (filter === 'all') return true
    return request.status.toLowerCase() === filter.toLowerCase()
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading return requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <ArrowPathIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Returns & Refunds</h1>
                  <p className="text-gray-600">Manage your return requests and refunds</p>
                </div>
              </div>
              <button
                onClick={() => setShowReturnForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>New Return Request</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter Tabs */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Returns', count: returnRequests.length },
                { key: 'pending', label: 'Pending', count: returnRequests.filter(r => r.status === 'PENDING').length },
                { key: 'approved', label: 'Approved', count: returnRequests.filter(r => r.status === 'APPROVED').length },
                { key: 'rejected', label: 'Rejected', count: returnRequests.filter(r => r.status === 'REJECTED').length },
                { key: 'picked_up', label: 'Picked Up', count: returnRequests.filter(r => r.status === 'PICKED_UP').length },
                { key: 'processed', label: 'Processed', count: returnRequests.filter(r => r.status === 'PROCESSED').length },
                { key: 'refunded', label: 'Refunded', count: returnRequests.filter(r => r.status === 'REFUNDED').length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === tab.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Return Requests List */}
          {filteredReturns.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <ArrowPathIcon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Return Requests</h2>
              <p className="text-gray-600 mb-8">
                {filter === 'all' 
                  ? "You haven't created any return requests yet." 
                  : 'No return requests found for the selected filter.'}
              </p>
              <button
                onClick={() => setShowReturnForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                Create Return Request
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredReturns.map((request) => {
                const StatusIcon = getStatusIcon(request.status)
                return (
                  <div key={request.id} className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-start space-x-4">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <img
                          src={request.productImage}
                          alt={request.productName}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>

                      {/* Return Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{request.productName}</h3>
                            <p className="text-sm text-gray-500">Order #{request.orderId}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                              {request.status.replace('_', ' ')}
                            </span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleEdit(request)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(request.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2">
                            <ExclamationTriangleIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              <strong>Reason:</strong> {request.reason}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            <strong>Description:</strong> {request.description}
                          </p>
                          {request.refundAmount > 0 && (
                            <p className="text-sm text-gray-600">
                              <strong>Refund Amount:</strong> {formatCurrency(decimalToNumber(request.refundAmount))}
                            </p>
                          )}
                          {request.pickupDate && (
                            <p className="text-sm text-gray-600">
                              <strong>Pickup Date:</strong> {new Date(request.pickupDate).toLocaleDateString()}
                            </p>
                          )}
                          {request.trackingNumber && (
                            <p className="text-sm text-gray-600">
                              <strong>Tracking Number:</strong> {request.trackingNumber}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
                          <span>Updated: {new Date(request.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Return Request Form Modal */}
        {showReturnForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingReturn ? 'Edit Return Request' : 'Create Return Request'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowReturnForm(false)
                      setEditingReturn(null)
                      setNewReturn({
                        orderId: 0,
                        productId: 0,
                        productName: '',
                        reason: '',
                        description: ''
                      })
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmitReturn} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order ID
                  </label>
                  <input
                    type="number"
                    value={newReturn.orderId}
                    onChange={(e) => setNewReturn({ ...newReturn, orderId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter order ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={newReturn.productName}
                    onChange={(e) => setNewReturn({ ...newReturn, productName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Reason
                  </label>
                  <select
                    value={newReturn.reason}
                    onChange={(e) => setNewReturn({ ...newReturn, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a reason</option>
                    {returnReasons.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newReturn.description}
                    onChange={(e) => setNewReturn({ ...newReturn, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Please provide detailed information about why you want to return this item..."
                    required
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReturnForm(false)
                      setEditingReturn(null)
                      setNewReturn({
                        orderId: 0,
                        productId: 0,
                        productName: '',
                        reason: '',
                        description: ''
                      })
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                  >
                    {editingReturn ? 'Update Request' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  )
}
