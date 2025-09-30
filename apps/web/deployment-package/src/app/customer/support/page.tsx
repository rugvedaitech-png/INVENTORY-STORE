'use client'

import { useState } from 'react'
import {
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline'

interface SupportTicket {
  id: number
  subject: string
  message: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  createdAt: string
  updatedAt: string
  responses?: Array<{
    id: number
    message: string
    isFromSupport: boolean
    createdAt: string
  }>
}

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState('faq')
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [showNewTicketForm, setShowNewTicketForm] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  })

  const faqItems = [
    {
      question: "How do I track my order?",
      answer: "You can track your order by going to the 'Order Tracking' section in your dashboard. Enter your order number or select from your recent orders to see the current status and delivery updates."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit/debit cards, UPI payments, digital wallets like Paytm and PhonePe, and net banking. You can manage your payment methods in the 'Payment Methods' section."
    },
    {
      question: "How can I cancel my order?",
      answer: "You can cancel your order within 30 minutes of placing it. Go to 'My Orders', select the order you want to cancel, and click the 'Cancel Order' button. Refunds will be processed within 3-5 business days."
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 7-day return policy for most items. Items must be in original condition with tags attached. Some items like perishables and personal care products are not eligible for returns."
    },
    {
      question: "How do I update my delivery address?",
      answer: "You can update your delivery addresses in the 'Addresses' section. Add new addresses, edit existing ones, or set a default address for faster checkout."
    },
    {
      question: "How can I contact customer support?",
      answer: "You can reach us through this support page, call us at +91-9876543210, or email us at support@example.com. We're available 24/7 to help you."
    }
  ]

  const contactMethods = [
    {
      icon: PhoneIcon,
      title: "Phone Support",
      description: "Call us for immediate assistance",
      contact: "+91-9876543210",
      availability: "24/7 Available"
    },
    {
      icon: EnvelopeIcon,
      title: "Email Support",
      description: "Send us an email and we'll respond within 24 hours",
      contact: "support@example.com",
      availability: "24/7 Available"
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Live Chat",
      description: "Chat with our support team in real-time",
      contact: "Start Chat",
      availability: "9 AM - 9 PM"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'text-blue-600 bg-blue-100'
      case 'IN_PROGRESS':
        return 'text-yellow-600 bg-yellow-100'
      case 'RESOLVED':
        return 'text-green-600 bg-green-100'
      case 'CLOSED':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'text-green-600 bg-green-100'
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100'
      case 'HIGH':
        return 'text-orange-600 bg-orange-100'
      case 'URGENT':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault()
    const ticket: SupportTicket = {
      id: Date.now(),
      subject: newTicket.subject,
      message: newTicket.message,
      status: 'OPEN',
      priority: newTicket.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setTickets([ticket, ...tickets])
    setNewTicket({ subject: '', message: '', priority: 'MEDIUM' })
    setShowNewTicketForm(false)
    setActiveTab('tickets')
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Customer Support</h1>
                  <p className="text-gray-600">Get help and support for your orders</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewTicketForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
                <span>New Ticket</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { key: 'faq', label: 'FAQ', count: faqItems.length },
                  { key: 'contact', label: 'Contact Us', count: contactMethods.length },
                  { key: 'tickets', label: 'My Tickets', count: tickets.length }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* FAQ Tab */}
              {activeTab === 'faq' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                  <div className="space-y-4">
                    {faqItems.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.question}</h3>
                        <p className="text-gray-600">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Tab */}
              {activeTab === 'contact' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {contactMethods.map((method, index) => {
                      const Icon = method.icon
                      return (
                        <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{method.title}</h3>
                          <p className="text-gray-600 mb-4">{method.description}</p>
                          <div className="space-y-2">
                            <p className="font-medium text-gray-900">{method.contact}</p>
                            <p className="text-sm text-gray-500">{method.availability}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Tickets Tab */}
              {activeTab === 'tickets' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">My Support Tickets</h2>
                    <button
                      onClick={() => setShowNewTicketForm(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      New Ticket
                    </button>
                  </div>
                  
                  {tickets.length === 0 ? (
                    <div className="text-center py-12">
                      <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Support Tickets</h3>
                      <p className="text-gray-500 mb-6">You haven't created any support tickets yet.</p>
                      <button
                        onClick={() => setShowNewTicketForm(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold"
                      >
                        Create First Ticket
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">{ticket.subject}</h3>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-3 line-clamp-2">{ticket.message}</p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                            <span>Updated: {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* New Ticket Modal */}
        {showNewTicketForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Create Support Ticket</h3>
                  <button
                    onClick={() => setShowNewTicketForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmitTicket} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={newTicket.message}
                    onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={6}
                    placeholder="Please provide detailed information about your issue..."
                    required
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewTicketForm(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                  >
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  )
}
