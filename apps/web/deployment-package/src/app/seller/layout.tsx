import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SellerLayoutClient from './SellerLayoutClient'

// Temporary fix for UserRole import issue
enum UserRole {
  STORE_OWNER = 'STORE_OWNER',
  SUPPLIER = 'SUPPLIER',
  CUSTOMER = 'CUSTOMER'
}

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login')
  }

  if (session.user.role !== UserRole.STORE_OWNER) {
    redirect('/unauthorized')
  }

  return (
    <SellerLayoutClient 
      userEmail={session.user?.email}
      userName={session.user?.name || 'User'}
    >
      {children}
    </SellerLayoutClient>
  )
}
