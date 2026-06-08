import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> }

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const authRoutes = ['/login', '/register']
  if (authRoutes.includes(pathname) && user) {
    const profile = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const role = profile.data?.role ?? 'customer'
    const redirectMap: Record<string, string> = {
      customer: '/dashboard',
      driver:   '/driver',
      admin:    '/admin',
    }
    return NextResponse.redirect(new URL(redirectMap[role] ?? '/dashboard', request.url))
  }

  const protectedPrefixes = ['/dashboard', '/bookings', '/driver', '/admin']
  const isProtected = protectedPrefixes.some(p => pathname.startsWith(p))
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/admin') && user) {
    const profile = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile.data?.role !== 'admin') return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  if (pathname.startsWith('/driver') && user) {
    const profile = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile.data?.role !== 'driver') return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}
