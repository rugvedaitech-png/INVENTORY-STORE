import { db } from './db'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

export interface User {
  id: number
  email: string
  name: string | null
  role: UserRole
  phone: string | null
  createdAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
  role?: UserRole
}

export interface RegisterData {
  name: string
  email: string
  phone: string
  password: string
  role: UserRole
}

export class AuthService {
  /**
   * Authenticate user with email and password
   */
  static async authenticate(credentials: LoginCredentials): Promise<User | null> {
    try {
      const user = await db.user.findUnique({
        where: {
          email: credentials.email,
        },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          role: true,
          phone: true,
          createdAt: true,
        },
      })

      if (!user) {
        return null
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(credentials.password, user.password)
      if (!isValidPassword) {
        return null
      }

      // Check role if specified
      if (credentials.role && user.role !== credentials.role) {
        return null
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    } catch (error) {
      console.error('Authentication error:', error)
      return null
    }
  }

  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<User | null> {
    try {
      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { email: data.email }
      })

      if (existingUser) {
        throw new Error('User with this email already exists')
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12)

      // Create user
      const user = await db.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: hashedPassword,
          role: data.role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          createdAt: true,
        },
      })

      // If it's a customer, also create a customer record
      if (data.role === UserRole.CUSTOMER) {
        await db.customer.create({
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: '', // Will be updated later
            userId: user.id,
          },
        })
      }

      return user
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<User | null> {
    try {
      const user = await db.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          createdAt: true,
        },
      })

      return user
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await db.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          createdAt: true,
        },
      })

      return user
    } catch (error) {
      console.error('Get user by email error:', error)
      return null
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      
      await db.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      })

      return true
    } catch (error) {
      console.error('Update password error:', error)
      return false
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, data: Partial<Pick<User, 'name' | 'phone'>>): Promise<User | null> {
    try {
      const user = await db.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          phone: data.phone,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          createdAt: true,
        },
      })

      return user
    } catch (error) {
      console.error('Update profile error:', error)
      return null
    }
  }

  /**
   * Verify user role
   */
  static async verifyRole(userId: string, requiredRole: UserRole): Promise<boolean> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      return user?.role === requiredRole
    } catch (error) {
      console.error('Verify role error:', error)
      return false
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      const users = await db.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return users
    } catch (error) {
      console.error('Get all users error:', error)
      return []
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      await db.user.delete({
        where: { id: userId },
      })

      return true
    } catch (error) {
      console.error('Delete user error:', error)
      return false
    }
  }
}
