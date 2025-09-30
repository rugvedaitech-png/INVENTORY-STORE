import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CustomerLayoutClient from './CustomerLayoutClient'

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login')
  }

  // Check if user has customer role (you can add role checking here if needed)
  // For now, we'll allow any authenticated user to access customer pages

  return (
    <CustomerLayoutClient 
      userEmail={session.user.email || 'customer@example.com'}
      userName={session.user.name || 'Customer User'}
    >
      {children}
    </CustomerLayoutClient>
  )
}
