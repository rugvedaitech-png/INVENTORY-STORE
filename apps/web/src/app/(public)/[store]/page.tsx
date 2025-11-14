import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
        include: {
          category: true
        },
        orderBy: { createdAt: 'desc' },
      },
      categories: {
        where: { active: true },
        include: {
          _count: {
            select: {
              products: {
                where: { active: true }
              }
            }
          }
        },
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' }
        ]
      }
    },
  })

  return store
}

export default async function StorePage({ params }: StorePageProps) {
  const { store: storeSlug } = await params

  // Check if user is authenticated
  const session = await getServerSession(authOptions)

  // If user is logged in, check if they should be redirected to their assigned store
  if (session?.user) {
    const user = await db.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { store: true }
    })

    // If user has a storeId and it doesn't match the current store, redirect them
    if (user?.storeId && user.store && user.store.slug !== storeSlug) {
      redirect(`/${user.store.slug}`)
    }
  }

  const store = await getStore(storeSlug)

  if (!store) {
    notFound()
  }

  // Redirect to client-side store page
  redirect(`/${storeSlug}/browse`)
}