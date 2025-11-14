'use client'

import { useState, useEffect } from 'react'
import {
  StarIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface Review {
  id: number
  productId: number
  productName: string
  productImage: string
  rating: number
  title: string
  comment: string
  createdAt: string
  isVerified: boolean
  helpful: number
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [filter, setFilter] = useState('all')
  const [newReview, setNewReview] = useState({
    productId: 0,
    productName: '',
    rating: 5,
    title: '',
    comment: ''
  })

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockReviews: Review[] = [
        {
          id: 1,
          productId: 1,
          productName: 'Basmati Rice (1kg)',
          productImage: '/uploads/products/rice.jpg',
          rating: 5,
          title: 'Excellent Quality',
          comment: 'The rice is of excellent quality and cooks perfectly. Highly recommended!',
          createdAt: '2025-01-10T10:30:00Z',
          isVerified: true,
          helpful: 12
        },
        {
          id: 2,
          productId: 2,
          productName: 'Toor Dal (500g)',
          productImage: '/uploads/products/dal.jpg',
          rating: 4,
          title: 'Good Quality',
          comment: 'Good quality dal, cooks well. Could be a bit more fresh but overall satisfied.',
          createdAt: '2025-01-08T14:20:00Z',
          isVerified: true,
          helpful: 8
        },
        {
          id: 3,
          productId: 3,
          productName: 'Cooking Oil (1L)',
          productImage: '/uploads/products/oil.jpg',
          rating: 3,
          title: 'Average',
          comment: 'The oil is okay but the packaging could be better. Price is reasonable.',
          createdAt: '2025-01-05T16:45:00Z',
          isVerified: false,
          helpful: 3
        }
      ]
      setReviews(mockReviews)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingReview) {
        // Update existing review
        const updatedReview: Review = {
          ...editingReview,
          ...newReview,
          createdAt: editingReview.createdAt,
          productImage: editingReview.productImage,
          isVerified: editingReview.isVerified,
          helpful: editingReview.helpful
        }

        setReviews(reviews.map(review =>
          review.id === editingReview.id ? updatedReview : review
        ))
      } else {
        // Add new review
        const review: Review = {
          ...newReview,
          id: Date.now(),
          productImage: '/uploads/products/default.jpg',
          createdAt: new Date().toISOString(),
          isVerified: false,
          helpful: 0
        }
        setReviews([review, ...reviews])
      }
      
      setShowReviewForm(false)
      setEditingReview(null)
      setNewReview({
        productId: 0,
        productName: '',
        rating: 5,
        title: '',
        comment: ''
      })
    } catch (error) {
      console.error('Error saving review:', error)
    }
  }

  const handleEdit = (review: Review) => {
    setEditingReview(review)
    setNewReview({
      productId: review.productId,
      productName: review.productName,
      rating: review.rating,
      title: review.title,
      comment: review.comment
    })
    setShowReviewForm(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this review?')) {
      setReviews(reviews.filter(review => review.id !== id))
    }
  }

  const handleHelpful = (id: number) => {
    setReviews(reviews.map(review => 
      review.id === id ? { ...review, helpful: review.helpful + 1 } : review
    ))
  }

  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true
    if (filter === 'verified') return review.isVerified
    if (filter === '5-star') return review.rating === 5
    if (filter === '4-star') return review.rating === 4
    if (filter === '3-star') return review.rating === 3
    if (filter === '2-star') return review.rating === 2
    if (filter === '1-star') return review.rating === 1
    return true
  })

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
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
                  <StarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
                  <p className="text-gray-600">Manage your product reviews and ratings</p>
                </div>
              </div>
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Write Review</span>
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
                { key: 'all', label: 'All Reviews', count: reviews.length },
                { key: 'verified', label: 'Verified', count: reviews.filter(r => r.isVerified).length },
                { key: '5-star', label: '5 Stars', count: reviews.filter(r => r.rating === 5).length },
                { key: '4-star', label: '4 Stars', count: reviews.filter(r => r.rating === 4).length },
                { key: '3-star', label: '3 Stars', count: reviews.filter(r => r.rating === 3).length },
                { key: '2-star', label: '2 Stars', count: reviews.filter(r => r.rating === 2).length },
                { key: '1-star', label: '1 Star', count: reviews.filter(r => r.rating === 1).length }
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

          {/* Reviews List */}
          {filteredReviews.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <StarIcon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Reviews Found</h2>
              <p className="text-gray-600 mb-8">
                {filter === 'all' 
                  ? "You haven't written any reviews yet." 
                  : 'No reviews found for the selected filter.'}
              </p>
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                Write Your First Review
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-start space-x-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <img
                        src={review.productImage}
                        alt={review.productName}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>

                    {/* Review Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{review.productName}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                            {review.isVerified && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckIcon className="w-3 h-3 mr-1" />
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(review)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(review.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-md font-medium text-gray-900 mb-2">{review.title}</h4>
                      <p className="text-gray-600 mb-4">{review.comment}</p>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleHelpful(review.id)}
                          className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <CheckIcon className="w-4 h-4" />
                          <span>Helpful ({review.helpful})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Form Modal */}
        {showReviewForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingReview ? 'Edit Review' : 'Write a Review'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowReviewForm(false)
                      setEditingReview(null)
                      setNewReview({
                        productId: 0,
                        productName: '',
                        rating: 5,
                        title: '',
                        comment: ''
                      })
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={newReview.productName}
                    onChange={(e) => setNewReview({ ...newReview, productName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
                        className="focus:outline-none"
                      >
                        <StarIcon
                          className={`w-8 h-8 ${
                            i < newReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {newReview.rating} star{newReview.rating !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Title
                  </label>
                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief title for your review"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Comment
                  </label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Share your experience with this product..."
                    required
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewForm(false)
                      setEditingReview(null)
                      setNewReview({
                        productId: 0,
                        productName: '',
                        rating: 5,
                        title: '',
                        comment: ''
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
                    {editingReview ? 'Update Review' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  )
}
