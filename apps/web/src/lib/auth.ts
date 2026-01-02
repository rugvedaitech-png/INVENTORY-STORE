import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
import { UserRole } from '@prisma/client'
import { AuthService } from './auth-service'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: UserRole
      phone?: string | null
    }
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  trustHost: true, // Trust host from X-Forwarded-Host header (needed behind nginx reverse proxy)
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT ? parseInt(process.env.EMAIL_SERVER_PORT) : 587,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' }
      },
      async authorize(credentials) {
        console.log('NextAuth authorize called with:', { 
          email: credentials?.email, 
          password: credentials?.password ? '***' : 'missing',
          role: credentials?.role 
        })

        if (!credentials?.email || !credentials?.password) {
          console.log('Missing email or password')
          return null
        }

        try {
          const user = await AuthService.authenticate({
            email: credentials.email,
            password: credentials.password,
            role: credentials.role as UserRole,
          })

          console.log('AuthService.authenticate result:', user ? 'SUCCESS' : 'FAILED')
          
          if (!user) {
            console.log('Authentication failed - user not found or invalid credentials')
            return null
          }

          console.log('Returning user:', { id: user.id, email: user.email, role: user.role })

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
          }
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    session: async ({ session, user, token }) => {
      if (session?.user) {
        if (user) {
          session.user.id = user.id
          const dbUser = await db.user.findUnique({
            where: { id: parseInt(user.id) },
            select: { role: true, phone: true }
          })
          session.user.role = dbUser?.role || UserRole.CUSTOMER
          session.user.phone = dbUser?.phone
        } else if (token) {
          session.user.id = token.id as string
          session.user.role = token.role as UserRole
          session.user.phone = token.phone as string
        }
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.id = user.id
        if ('role' in user) {
          token.role = (user as any).role
        }
        if ('phone' in user) {
          token.phone = (user as any).phone
        }
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
}
