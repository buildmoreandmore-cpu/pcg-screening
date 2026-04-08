import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // CRITICAL: Never touch /sign-in requests — those go to Binary Evolution legacy dashboard
  if (pathname.startsWith('/sign-in')) {
    return NextResponse.next()
  }

  // Redirect /login to /portal/login (unified entry point)
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/portal/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /sign-in (Binary Evolution legacy — NEVER intercept)
     * - /_next/static
     * - /_next/image
     * - /favicon.ico
     * - /api (handled by API routes)
     * - Static files (.png, .jpg, .css, .js, etc.)
     */
    '/((?!sign-in|_next/static|_next/image|favicon.ico|api|.*\\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
}
