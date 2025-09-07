import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'

interface StorePageProps {
  params: {
    store: string
  }
}

async function getStore(slug: string) {
  const store = await db.store.findUnique({
    where: { slug },
    include: {
      products: {
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  return store
}

export default async function StorePage({ params }: StorePageProps) {
  const { store: storeSlug } = await params
  const store = await getStore(storeSlug)

  if (!store) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
              {store.whatsapp && (
                <p className="text-sm text-gray-600 mt-1">
                  📱 WhatsApp: {store.whatsapp}
                </p>
              )}
            </div>
            <Link
              href={`/${storeSlug}/cart`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Cart
            </Link>
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {store.products.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              No products available
            </h2>
            <p className="text-gray-600">
              This store doesn&apos;t have any products yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {store.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                storeSlug={storeSlug}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
