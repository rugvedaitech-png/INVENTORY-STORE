import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-service'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json()
    
    console.log('Debug auth attempt:', { email, password: '***', role })
    
    const user = await AuthService.authenticate({
      email,
      password,
      role: role as UserRole,
    })
    
    console.log('Auth result:', user ? 'SUCCESS' : 'FAILED')
    
    if (user) {
      return NextResponse.json({ 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          storeId: user.storeId
        }
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication failed' 
      })
    }
  } catch (error) {
    console.error('Debug auth error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
