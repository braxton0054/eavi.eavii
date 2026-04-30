import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getSession(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getSession() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  const userRole = user?.user_metadata?.role

  // Allow access to login pages and application form without authentication
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/oauth') &&
    !request.nextUrl.pathname.startsWith('/reset-password') &&
    request.nextUrl.pathname !== '/' &&
    request.nextUrl.pathname !== '/apply'
  ) {
    const url = request.nextUrl.clone()
    // Redirect to appropriate login based on route
    if (request.nextUrl.pathname.startsWith('/student')) {
      url.pathname = '/login/student'
    } else if (request.nextUrl.pathname.startsWith('/lecturer')) {
      url.pathname = '/login/lecturer'
    } else {
      url.pathname = '/login/admin'
    }
    return NextResponse.redirect(url)
  }

  // Check role-based access control
  if (user) {
    const url = request.nextUrl.clone()

    // Admin routes require admin role
    if (request.nextUrl.pathname.startsWith('/admin') && userRole !== 'admin') {
      url.pathname = '/login/admin'
      return NextResponse.redirect(url)
    }

    // Student routes require student role
    if (request.nextUrl.pathname.startsWith('/student') && userRole !== 'student') {
      url.pathname = '/login/student'
      return NextResponse.redirect(url)
    }

    // Lecturer routes require lecturer role
    if (request.nextUrl.pathname.startsWith('/lecturer') && userRole !== 'lecturer') {
      url.pathname = '/login/lecturer'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)',
  ],
}
