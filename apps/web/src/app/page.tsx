import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Inventory Store Platform
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            A comprehensive inventory management system for stores, suppliers, and customers
          </p>
        </div>

        <div className="mt-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Store Owner */}
            <div className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <Link href="/auth/login" className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Store Owner
                  </Link>
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Manage your inventory, orders, suppliers, and store operations.
                </p>
                <div className="mt-4">
                  <Link
                    href="/auth/login"
                    className="text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    Access Dashboard →
                  </Link>
                </div>
              </div>
            </div>

            {/* Supplier */}
            <div className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 rounded-lg shadow">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <Link href="/auth/login" className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Supplier
                  </Link>
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  View purchase orders, manage deliveries, and track your business.
                </p>
                <div className="mt-4">
                  <Link
                    href="/auth/login"
                    className="text-green-600 hover:text-green-500 font-medium"
                  >
                    Access Dashboard →
                  </Link>
                </div>
              </div>
            </div>

            {/* Customer */}
            <div className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-purple-500 rounded-lg shadow">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <Link href="/auth/login" className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Customer
                  </Link>
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Browse products, place orders, and track your purchases.
                </p>
                <div className="mt-4">
                  <Link
                    href="/auth/login"
                    className="text-purple-600 hover:text-purple-500 font-medium"
                  >
                    Access Dashboard →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}