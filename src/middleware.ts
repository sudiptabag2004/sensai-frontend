import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })
  
  // Define authentication paths
  const authRoutes = ['/login']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  // Public paths that don't require authentication
  const publicPaths = ['/api/auth']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  // If the path is public, allow access
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // Redirect logic
  if (isAuthRoute) {
    if (token) {
      // Logged in users trying to access login page - redirect to home
      return NextResponse.redirect(new URL('/', request.url))
    }
    // Allow non-logged in users to access auth pages
    return NextResponse.next()
  }
  
  // Protect other routes - redirect to login if not authenticated
  if (!token) {
    // Use request.url as base instead of environment variable to avoid build-time issues
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next()
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (for NextAuth.js)
     * - _next/static (for static files)
     * - _next/image (for Next.js Image optimization)
     * - favicon.ico (for favicon)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|images).*)',
  ],
} 