'use client'

import { useState, useEffect } from 'react'
import {
    XMarkIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface Category {
    id: number
    name: string
}

interface Product {
    id: number
    sku: string
    title: string
}

interface SingleProductFormProps {
    suppliers: Array<{ id: number; name: string }>
    onSuccess: () => void
    onClose: () => void
}

export default function SingleProductForm({ suppliers, onSuccess, onClose }: SingleProductFormProps) {
    const [supplierId, setSupplierId] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [newCategoryName, setNewCategoryName] = useState('')
    const [showNewCategory, setShowNewCategory] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [loadingCategories, setLoadingCategories] = useState(true)
    const [products, setProducts] = useState<Product[]>([])
    const [loadingProducts, setLoadingProducts] = useState(false)
    const [selectedProductId, setSelectedProductId] = useState('')
    const [sku, setSku] = useState('')
    const [title, setTitle] = useState('')
    const [quantity, setQuantity] = useState('')
    const [unitCost, setUnitCost] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState('')
    const [totalAmount, setTotalAmount] = useState('')
    const [notes, setNotes] = useState('')
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/categories?active=true')
                const data = await response.json()
                if (response.ok) {
                    setCategories(data.categories || [])
                }
            } catch (error) {
                console.error('Error fetching categories:', error)
            } finally {
                setLoadingCategories(false)
            }
        }
        fetchCategories()
    }, [])

    // Fetch products when category is selected
    useEffect(() => {
        const fetchProducts = async () => {
            if (!categoryId || showNewCategory) {
                setProducts([])
                setSelectedProductId('')
                setSku('')
                setTitle('')
                return
            }

            try {
                setLoadingProducts(true)
                const response = await fetch(`/api/products?categoryId=${categoryId}&active=true&limit=100`)
                const data = await response.json()
                if (response.ok) {
                    setProducts(data.products || [])
                    // Reset product selection when category changes
                    setSelectedProductId('')
                    setSku('')
                    setTitle('')
                }
            } catch (error) {
                console.error('Error fetching products:', error)
                setProducts([])
            } finally {
                setLoadingProducts(false)
            }
        }
        fetchProducts()
    }, [categoryId, showNewCategory])


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})
        setError(null)
        setSuccess(null)

        // Validation
        const newErrors: Record<string, string> = {}

        if (!supplierId) {
            newErrors.supplierId = 'Please select a supplier'
        }
        if (showNewCategory) {
            if (!newCategoryName.trim()) {
                newErrors.newCategoryName = 'New category name is required'
            }
        } else {
            if (!categoryId) {
                newErrors.categoryId = 'Please select a category'
            }
        }
        if (!sku.trim()) {
            newErrors.sku = 'SKU is required'
        }
        if (!title.trim()) {
            newErrors.title = 'Product title is required'
        }
        if (!quantity || parseInt(quantity) <= 0) {
            newErrors.quantity = 'Quantity must be greater than 0'
        }
        if (!unitCost || parseFloat(unitCost) < 0) {
            newErrors.unitCost = 'Unit cost must be non-negative'
        }
        if (!totalAmount || parseFloat(totalAmount) <= 0) {
            newErrors.totalAmount = 'Total amount must be greater than 0'
        } else {
            // Validate total amount is a valid number
            const enteredTotal = parseFloat(totalAmount)
            if (isNaN(enteredTotal)) {
                newErrors.totalAmount = 'Total amount must be a valid number'
            } else if (enteredTotal <= 0) {
                newErrors.totalAmount = 'Total amount must be greater than 0'
            } else {
                // Calculate expected total from quantity and unit cost for comparison
                if (quantity && unitCost) {
                    const qty = parseFloat(quantity)
                    const cost = parseFloat(unitCost)
                    if (!isNaN(qty) && !isNaN(cost) && qty > 0 && cost >= 0) {
                        const calculatedTotal = qty * cost
                        const difference = Math.abs(enteredTotal - calculatedTotal)
                        const tolerance = 0.01 // Allow 1 paise difference for rounding

                        // Warn if there's a significant difference, but allow it (user might have paid different amount)
                        // This is just for logging, not blocking submission
                        if (difference > tolerance && calculatedTotal > 0) {
                            console.warn(`Total amount (${enteredTotal}) differs from calculated (${calculatedTotal}) by ₹${difference.toFixed(2)}`)
                        }
                    }
                }
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
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
                    items: [{
                        category: showNewCategory ? newCategoryName.trim() : categories.find(c => c.id === parseInt(categoryId))?.name || '',
                        sku: sku.trim(),
                        title: title.trim(),
                        quantity: parseInt(quantity, 10),
                        unitCost: Math.round(parseFloat(unitCost) * 100), // Convert to paise
                        description: description.trim() || undefined,
                        price: price ? Math.round(parseFloat(price) * 100) : undefined,
                    }],
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to add product')
            }

            setSuccess(
                `Successfully added product. ` +
                `${data.summary.createdProducts > 0 ? 'Created new product.' : 'Updated existing product.'}`
            )

            // Reset form after 2 seconds
            setTimeout(() => {
                onSuccess()
                onClose()
            }, 2000)
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to add product')
        } finally {
            setSubmitting(false)
        }
    }

    // Calculate total amount from quantity and unit cost (only when button is clicked)
    const handleCalculate = () => {
        // Check if both fields have values
        if (!quantity || !unitCost) {
            setError('Please enter both quantity and unit cost to calculate')
            return
        }

        const qty = parseFloat(quantity)
        const cost = parseFloat(unitCost)

        // Validate inputs
        if (isNaN(qty) || isNaN(cost)) {
            setError('Please enter valid numbers for quantity and unit cost')
            return
        }

        if (qty <= 0) {
            setError('Quantity must be greater than 0')
            return
        }

        if (cost < 0) {
            setError('Unit cost must be non-negative')
            return
        }

        // Calculate and set total
        const calculated = qty * cost
        setTotalAmount(calculated.toFixed(2))
        setError(null) // Clear any previous errors
    }

    return (
        <div
            className="fixed inset-0 z-[9999] overflow-y-auto"
            onClick={onClose}
        >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-6 py-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Add Single Offline Product</h3>
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
                                    className={`w-full px-3 py-2 border rounded-md ${errors.supplierId ? 'border-red-500' : 'border-gray-300'
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

                            {/* Product Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={showNewCategory ? 'new' : categoryId}
                                        onChange={(e) => {
                                            if (e.target.value === 'new') {
                                                setShowNewCategory(true)
                                                setCategoryId('')
                                                setProducts([])
                                                setSelectedProductId('')
                                            } else {
                                                setShowNewCategory(false)
                                                setCategoryId(e.target.value)
                                                setNewCategoryName('')
                                            }
                                        }}
                                        className={`w-full px-3 py-2 border rounded-md ${errors.categoryId || errors.newCategoryName ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        disabled={loadingCategories}
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                        <option value="new">+ Add New Category</option>
                                    </select>
                                    {showNewCategory && (
                                        <input
                                            type="text"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            className={`mt-2 w-full px-3 py-2 border rounded-md ${errors.newCategoryName ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter new category name"
                                        />
                                    )}
                                    {(errors.categoryId || errors.newCategoryName) && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.categoryId || errors.newCategoryName}
                                        </p>
                                    )}
                                </div>

                                {/* Product Selection or SKU */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {products.length > 0 ? 'Select Product' : 'SKU Code'} <span className="text-red-500">*</span>
                                    </label>
                                    {products.length > 0 ? (
                                        <select
                                            value={selectedProductId}
                                            onChange={(e) => {
                                                const productId = e.target.value
                                                setSelectedProductId(productId)
                                                if (productId) {
                                                    const product = products.find(p => p.id === parseInt(productId))
                                                    if (product) {
                                                        setSku(product.sku)
                                                        setTitle(product.title)
                                                    }
                                                } else {
                                                    setSku('')
                                                    setTitle('')
                                                }
                                            }}
                                            className={`w-full px-3 py-2 border rounded-md ${errors.sku ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            disabled={loadingProducts}
                                        >
                                            <option value="">Select a product</option>
                                            {products.map((product) => (
                                                <option key={product.id} value={product.id}>
                                                    {product.title} ({product.sku})
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={sku}
                                            onChange={(e) => setSku(e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-md ${errors.sku ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="e.g., ELEC001"
                                        />
                                    )}
                                    {errors.sku && (
                                        <p className="mt-1 text-sm text-red-600">{errors.sku}</p>
                                    )}
                                    {loadingProducts && (
                                        <p className="mt-1 text-xs text-gray-500">Loading products...</p>
                                    )}
                                    {!loadingProducts && categoryId && !showNewCategory && products.length === 0 && (
                                        <p className="mt-1 text-xs text-gray-500">No products found in this category. Enter new product details below.</p>
                                    )}
                                </div>
                            </div>

                            {/* Title - Only show if no products or product not selected */}
                            {(!categoryId || showNewCategory || products.length === 0 || !selectedProductId) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Product Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        disabled={selectedProductId !== '' && products.length > 0}
                                        className={`w-full px-3 py-2 border rounded-md ${errors.title ? 'border-red-500' : 'border-gray-300'
                                            } ${selectedProductId !== '' && products.length > 0 ? 'bg-gray-100' : ''}`}
                                        placeholder="e.g., LED Bulb 10W"
                                    />
                                    {errors.title && (
                                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                                    )}
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Product description..."
                                />
                            </div>

                            {/* Quantity and Unit Cost */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantity <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => {
                                            setQuantity(e.target.value)
                                        }}
                                        className={`w-full px-3 py-2 border rounded-md ${errors.quantity ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="0"
                                    />
                                    {errors.quantity && (
                                        <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Unit Cost (₹) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={unitCost}
                                        onChange={(e) => {
                                            setUnitCost(e.target.value)
                                        }}
                                        className={`w-full px-3 py-2 border rounded-md ${errors.unitCost ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="0.00"
                                    />
                                    {errors.unitCost && (
                                        <p className="mt-1 text-sm text-red-600">{errors.unitCost}</p>
                                    )}
                                </div>
                            </div>

                            {/* Price (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Selling Price (₹) (Optional)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="0.00 (defaults to 150% of unit cost)"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    If not provided, will default to 150% of unit cost
                                </p>
                            </div>

                            {/* Total Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Total Amount Paid (₹) <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={totalAmount}
                                        onChange={(e) => {
                                            const value = e.target.value
                                            // Allow empty string for clearing or valid positive numbers
                                            if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                                                setTotalAmount(value)
                                            }
                                        }}
                                        className={`flex-1 px-3 py-2 border rounded-md ${errors.totalAmount ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="0.00"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCalculate}
                                        className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50 whitespace-nowrap"
                                        title="Calculate total from quantity × unit cost"
                                    >
                                        Calculate
                                    </button>
                                </div>
                                {errors.totalAmount && (
                                    <p className="mt-1 text-sm text-red-600">{errors.totalAmount}</p>
                                )}
                                {quantity && unitCost && totalAmount && (() => {
                                    const qty = parseFloat(quantity)
                                    const cost = parseFloat(unitCost)
                                    if (isNaN(qty) || isNaN(cost) || qty <= 0 || cost < 0) return null
                                    const calculated = qty * cost
                                    const entered = parseFloat(totalAmount)
                                    if (isNaN(entered)) return null
                                    const difference = Math.abs(entered - calculated)
                                    if (difference > 0.01 && calculated > 0) {
                                        return (
                                            <p className="mt-1 text-xs text-amber-600">
                                                Calculated: ₹{calculated.toFixed(2)} (Quantity × Unit Cost).
                                                {difference > 1 ? ' Significant difference detected.' : ' Minor difference.'}
                                            </p>
                                        )
                                    }
                                    return (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Calculated: ₹{calculated.toFixed(2)} (Quantity × Unit Cost)
                                        </p>
                                    )
                                })()}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Additional notes about this purchase..."
                                />
                            </div>

                            {/* Success Message */}
                            {success && (
                                <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                                    <p className="text-sm text-green-800">{success}</p>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && !success && (
                                <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                                    <p className="text-sm text-red-800">{error}</p>
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
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Adding...' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

