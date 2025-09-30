'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { UserRole } from '@prisma/client'

export interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  phone: string | null
}

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const user: User | null = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    phone: session.user.phone,
  } : null

  const isLoading = status === 'loading'
  const isAuthenticated = !!user

  const login = async (email: string, password: string, role?: UserRole) => {
    const result = await signIn('credentials', {
      email,
      password,
      role,
      redirect: false,
    })

    if (result?.error) {
      throw new Error('Invalid credentials')
    }

    return result
  }

  const logout = async () => {
    await signOut({ redirect: false })
    router.push('/auth/login')
  }

  const hasRole = (role: UserRole) => {
    return user?.role === role
  }

  const hasAnyRole = (roles: UserRole[]) => {
    return user && roles.includes(user.role)
  }

  const requireAuth = () => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return false
    }
    return true
  }

  const requireRole = (role: UserRole) => {
    if (!requireAuth()) return false
    if (!hasRole(role)) {
      router.push('/unauthorized')
      return false
    }
    return true
  }

  const requireAnyRole = (roles: UserRole[]) => {
    if (!requireAuth()) return false
    if (!hasAnyRole(roles)) {
      router.push('/unauthorized')
      return false
    }
    return true
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    hasRole,
    hasAnyRole,
    requireAuth,
    requireRole,
    requireAnyRole,
  }
}
