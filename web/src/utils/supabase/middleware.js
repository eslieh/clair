import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (
    !user &&
    !pathname.startsWith('/auth') && 
    pathname !== '/'
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // Profile completion check for authenticated users in /app
  if (user && pathname.startsWith('/app') && pathname !== '/app/setup') {
    const { data: profile } = await supabase
      .from('profile')
      .select('username, display_name')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.username || !profile.display_name) {
      console.log(`[Middleware] Incomplete profile for ${user.id}, redirecting to /app/setup`)
      const url = request.nextUrl.clone()
      url.pathname = '/app/setup'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
