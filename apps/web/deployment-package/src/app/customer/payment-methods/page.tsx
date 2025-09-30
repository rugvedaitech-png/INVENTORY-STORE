'use client'

import { useState, useEffect } from 'react'
import {
  CreditCardIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline'

interface PaymentMethod {
  id: number
  type: 'CARD' | 'UPI' | 'WALLET' | 'NET_BANKING'
  name: string
  details: string
  isDefault: boolean
  expiryDate?: string
  lastFour?: string
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [formData, setFormData] = useState({
    type: 'CARD' as 'CARD' | 'UPI' | 'WALLET' | 'NET_BANKING',
    name: '',
    details: '',
    expiryDate: '',
    lastFour: '',
    isDefault: false
  })

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockMethods: PaymentMethod[] = [
        {
          id: 1,
          type: 'CARD',
          name: 'Visa Card',
          details: '**** **** **** 1234',
          isDefault: true,
          expiryDate: '12/25',
          lastFour: '1234'
        },
        {
          id: 2,
          type: 'UPI',
          name: 'Google Pay',
          details: 'user@paytm',
          isDefault: false
        },
        {
          id: 3,
          type: 'WALLET',
          name: 'Paytm Wallet',
          details: '+91 98765 43210',
          isDefault: false
        }
      ]
      setPaymentMethods(mockMethods)
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingMethod) {
        // Update existing payment method
        setPaymentMethods(paymentMethods.map(method => 
          method.id === editingMethod.id ? { ...formData, id: editingMethod.id } : method
        ))
      } else {
        // Add new payment method
        const newMethod: PaymentMethod = {
          ...formData,
          id: Date.now(), // Mock ID
        }
        setPaymentMethods([...paymentMethods, newMethod])
      }
      
      setShowForm(false)
      setEditingMethod(null)
      setFormData({
        type: 'CARD',
        name: '',
        details: '',
        expiryDate: '',
        lastFour: '',
        isDefault: false
      })
    } catch (error) {
      console.error('Error saving payment method:', error)
    }
  }

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method)
    setFormData(method)
    setShowForm(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this payment method?')) {
      setPaymentMethods(paymentMethods.filter(method => method.id !== id))
    }
  }

  const setDefaultMethod = (id: number) => {
    setPaymentMethods(paymentMethods.map(method => ({
      ...method,
      isDefault: method.id === id
    })))
  }

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'CARD':
        return CreditCardIcon
      case 'UPI':
        return DevicePhoneMobileIcon
      case 'WALLET':
        return BanknotesIcon
      case 'NET_BANKING':
        return CreditCardIcon
      default:
        return CreditCardIcon
    }
  }

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'CARD':
        return 'bg-blue-100 text-blue-800'
      case 'UPI':
        return 'bg-green-100 text-green-800'
      case 'WALLET':
        return 'bg-purple-100 text-purple-800'
      case 'NET_BANKING':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment methods...</p>
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
                  <CreditCardIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
                  <p className="text-gray-600">Manage your payment options</p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Add Payment Method</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {paymentMethods.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CreditCardIcon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Payment Methods</h2>
              <p className="text-gray-600 mb-8">Add your first payment method to get started.</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                Add Payment Method
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paymentMethods.map((method) => {
                const Icon = getPaymentTypeIcon(method.type)
                return (
                  <div
                    key={method.id}
                    className={`bg-white rounded-xl shadow-sm border p-6 relative ${
                      method.isDefault ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    {method.isDefault && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          Default
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{method.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentTypeColor(method.type)}`}>
                            {method.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(method)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(method.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-gray-600 text-sm font-mono">{method.details}</p>
                      {method.expiryDate && (
                        <p className="text-gray-500 text-xs">Expires: {method.expiryDate}</p>
                      )}
                    </div>

                    {!method.isDefault && (
                      <button
                        onClick={() => setDefaultMethod(method.id)}
                        className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add/Edit Payment Method Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowForm(false)
                      setEditingMethod(null)
                      setFormData({
                        type: 'CARD',
                        name: '',
                        details: '',
                        expiryDate: '',
                        lastFour: '',
                        isDefault: false
                      })
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'CARD' | 'UPI' | 'WALLET' | 'NET_BANKING' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="UPI">UPI</option>
                    <option value="WALLET">Digital Wallet</option>
                    <option value="NET_BANKING">Net Banking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.type === 'CARD' ? 'Card Name' : formData.type === 'UPI' ? 'UPI ID' : 'Wallet Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={formData.type === 'CARD' ? 'e.g., Visa Card' : formData.type === 'UPI' ? 'e.g., user@paytm' : 'e.g., Paytm Wallet'}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.type === 'CARD' ? 'Card Number' : formData.type === 'UPI' ? 'UPI ID' : 'Wallet Details'}
                  </label>
                  <input
                    type="text"
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={formData.type === 'CARD' ? '1234 5678 9012 3456' : formData.type === 'UPI' ? 'user@paytm' : 'Wallet details'}
                    required
                  />
                </div>

                {formData.type === 'CARD' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last 4 Digits
                      </label>
                      <input
                        type="text"
                        value={formData.lastFour}
                        onChange={(e) => setFormData({ ...formData, lastFour: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1234"
                        maxLength={4}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                    Set as default payment method
                  </label>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingMethod(null)
                      setFormData({
                        type: 'CARD',
                        name: '',
                        details: '',
                        expiryDate: '',
                        lastFour: '',
                        isDefault: false
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
                    {editingMethod ? 'Update Payment Method' : 'Add Payment Method'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  )
}
