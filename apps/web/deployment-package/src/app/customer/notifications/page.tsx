'use client'

import { useState, useEffect } from 'react'
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  TruckIcon,
  CreditCardIcon,
  GiftIcon
} from '@heroicons/react/24/outline'

interface Notification {
  id: number
  type: 'ORDER' | 'PAYMENT' | 'DELIVERY' | 'PROMOTION' | 'SYSTEM'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  actionUrl?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockNotifications: Notification[] = [
        {
          id: 1,
          type: 'ORDER',
          title: 'Order Confirmed',
          message: 'Your order #12345 has been confirmed and is being processed.',
          isRead: false,
          createdAt: '2025-01-12T10:30:00Z',
          actionUrl: '/customer/orders'
        },
        {
          id: 2,
          type: 'DELIVERY',
          title: 'Order Shipped',
          message: 'Your order #12345 has been shipped and is on its way to you.',
          isRead: false,
          createdAt: '2025-01-12T14:20:00Z',
          actionUrl: '/customer/order-tracking'
        },
        {
          id: 3,
          type: 'PAYMENT',
          title: 'Payment Successful',
          message: 'Payment of ₹1,250.00 for order #12345 has been processed successfully.',
          isRead: true,
          createdAt: '2025-01-12T09:15:00Z',
          actionUrl: '/customer/orders'
        },
        {
          id: 4,
          type: 'PROMOTION',
          title: 'Special Offer',
          message: 'Get 20% off on your next order! Use code SAVE20 at checkout.',
          isRead: true,
          createdAt: '2025-01-11T16:45:00Z',
          actionUrl: '/'
        },
        {
          id: 5,
          type: 'SYSTEM',
          title: 'Profile Update Required',
          message: 'Please update your profile information to continue using our services.',
          isRead: false,
          createdAt: '2025-01-10T11:30:00Z',
          actionUrl: '/customer/profile'
        },
        {
          id: 6,
          type: 'DELIVERY',
          title: 'Order Delivered',
          message: 'Your order #12340 has been delivered successfully. Thank you for shopping with us!',
          isRead: true,
          createdAt: '2025-01-09T15:20:00Z',
          actionUrl: '/customer/orders'
        }
      ]
      setNotifications(mockNotifications)
      setUnreadCount(mockNotifications.filter(n => !n.isRead).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, isRead: true } : notification
    ))
    setUnreadCount(unreadCount - 1)
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, isRead: true })))
    setUnreadCount(0)
  }

  const deleteNotification = (id: number) => {
    const notification = notifications.find(n => n.id === id)
    if (notification && !notification.isRead) {
      setUnreadCount(unreadCount - 1)
    }
    setNotifications(notifications.filter(notification => notification.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER':
        return CheckCircleIcon
      case 'PAYMENT':
        return CreditCardIcon
      case 'DELIVERY':
        return TruckIcon
      case 'PROMOTION':
        return GiftIcon
      case 'SYSTEM':
        return InformationCircleIcon
      default:
        return BellIcon
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ORDER':
        return 'text-blue-600 bg-blue-100'
      case 'PAYMENT':
        return 'text-green-600 bg-green-100'
      case 'DELIVERY':
        return 'text-purple-600 bg-purple-100'
      case 'PROMOTION':
        return 'text-orange-600 bg-orange-100'
      case 'SYSTEM':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notification.isRead
    return notification.type.toLowerCase() === filter.toLowerCase()
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
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
                  <BellIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                  <p className="text-gray-600">
                    {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <CheckIcon className="w-5 h-5" />
                  <span>Mark All Read</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter Tabs */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All', count: notifications.length },
                { key: 'unread', label: 'Unread', count: unreadCount },
                { key: 'order', label: 'Orders', count: notifications.filter(n => n.type === 'ORDER').length },
                { key: 'delivery', label: 'Delivery', count: notifications.filter(n => n.type === 'DELIVERY').length },
                { key: 'payment', label: 'Payment', count: notifications.filter(n => n.type === 'PAYMENT').length },
                { key: 'promotion', label: 'Promotions', count: notifications.filter(n => n.type === 'PROMOTION').length }
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

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <BellIcon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Notifications</h2>
              <p className="text-gray-600">
                {filter === 'unread' 
                  ? 'You have no unread notifications.' 
                  : 'No notifications found for the selected filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type)
                return (
                  <div
                    key={notification.id}
                    className={`bg-white rounded-xl shadow-sm border p-6 transition-all duration-200 ${
                      !notification.isRead ? 'ring-2 ring-blue-100 bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`text-lg font-semibold ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <p className={`text-sm mb-3 ${
                          !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                        }`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                          
                          <div className="flex items-center space-x-2">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Mark as read
                              </button>
                            )}
                            {notification.actionUrl && (
                              <a
                                href={notification.actionUrl}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                              >
                                View details
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
  )
}
