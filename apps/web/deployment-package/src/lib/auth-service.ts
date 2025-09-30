import { db } from './db'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

export interface User {
  id: number
  email: string
  name: string | null
  role: UserRole
  phone: string | null
  storeId: number | null
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
  phone: string | null
  password: string
  role: UserRole
  storeId?: number | null
}

export class AuthService {
  /**
   * Authenticate user with email and password
   */
  static async authenticate(credentials: LoginCredentials): Promise<User | null> {
    try {
      console.log('AuthService.authenticate called with:', { 
        email: credentials.email, 
        role: credentials.role 
      })

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
          storeId: true,
          createdAt: true,
        },
      })

      console.log('User found in DB:', user ? 'YES' : 'NO')
      if (user) {
        console.log('User details:', { id: user.id, email: user.email, role: user.role })
      }

      if (!user) {
        console.log('No user found with email:', credentials.email)
        return null
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(credentials.password, user.password)
      console.log('Password valid:', isValidPassword)
      
      if (!isValidPassword) {
        console.log('Invalid password for user:', credentials.email)
        return null
      }

      // Check role if specified
      if (credentials.role && user.role !== credentials.role) {
        console.log('Role mismatch:', { expected: credentials.role, actual: user.role })
        return null
      }

      console.log('Authentication successful for user:', user.email)

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
          storeId: data.storeId,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          storeId: true,
          createdAt: true,
        },
      })

      // If it's a customer, also create a customer record
      if (data.role === UserRole.CUSTOMER && data.storeId) {
        await db.customer.create({
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: '', // Will be updated later
            userId: user.id,
            storeId: data.storeId,
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
        where: { id: parseInt(id) },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          storeId: true,
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
          storeId: true,
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
        where: { id: parseInt(userId) },
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
        where: { id: parseInt(userId) },
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
          storeId: true,
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
        where: { id: parseInt(userId) },
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
  static async getAllUsers(search?: string | null, page = 1, limit = 50): Promise<{ users: User[], pagination: { page: number, limit: number, total: number, pages: number } }> {
    try {
      const where: any = {}
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ]
      }

      const [users, total] = await Promise.all([
        db.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            storeId: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.user.count({ where })
      ])

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Get all users error:', error)
      return { users: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } }
    }
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: UserRole, search?: string | null, page = 1, limit = 50): Promise<{ users: User[], pagination: { page: number, limit: number, total: number, pages: number } }> {
    try {
      const where: any = { role }
      if (search) {
        where.AND = [
          { role },
          {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ]
          }
        ]
        delete where.role
      }

      const [users, total] = await Promise.all([
        db.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            storeId: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.user.count({ where })
      ])

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Get users by role error:', error)
      return { users: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } }
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      await db.user.delete({
        where: { id: parseInt(userId) },
      })

      return true
    } catch (error) {
      console.error('Delete user error:', error)
      return false
    }
  }
}
