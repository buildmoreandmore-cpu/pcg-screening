import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Not logged in — redirect to appropriate login
  if (!session) {
    const url = request.nextUrl.clone()
    const isAdmin = request.nextUrl.pathname.startsWith('/admin')
    url.pathname = isAdmin ? '/admin/login' : '/portal/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/portal/dashboard/:path*',
    '/portal/candidates/:path*',
    '/portal/invite/:path*',
    '/portal/team/:path*',
    '/portal/resources/:path*',
    '/portal/settings/:path*',
    '/admin/dashboard/:path*',
    '/admin/candidates/:path*',
    '/admin/clients/:path*',
    '/admin/users/:path*',
    '/admin/documents/:path*',
    '/admin/settings/:path*',
  ],
}
