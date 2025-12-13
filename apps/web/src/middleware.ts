import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Allow access to public routes and API routes
    if (pathname.startsWith('/demo-ration-store') || 
        pathname.startsWith('/success') ||
        pathname.startsWith('/api/orders') ||
        pathname.startsWith('/api/products') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/auth') ||
        pathname === '/') {
      return NextResponse.next()
    }

    // Check role-based access
    if (pathname.startsWith('/seller')) {
      if (!token || token.role !== 'STORE_OWNER') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    if (pathname.startsWith('/supplier')) {
      if (!token || token.role !== 'SUPPLIER') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    if (pathname.startsWith('/customer')) {
      if (!token || token.role !== 'CUSTOMER') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to public routes and API routes
        if (pathname.startsWith('/demo-ration-store') || 
            pathname.startsWith('/success') ||
            pathname.startsWith('/api/orders') ||
            pathname.startsWith('/api/products') ||
            pathname.startsWith('/api/auth') ||
            pathname.startsWith('/auth') ||
            pathname === '/') {
          return true
        }
        
        // Require authentication for protected routes
        if (pathname.startsWith('/seller') ||
            pathname.startsWith('/supplier') ||
            pathname.startsWith('/customer')) {
          return !!token
        }
        
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/seller/:path*',
    '/supplier/:path*',
    '/customer/:path*',
    '/api/suppliers/:path*',
    '/api/purchase-orders/:path*',
    '/api/inventory/:path*',
    '/api/stock-ledger/:path*',
  ]
}
