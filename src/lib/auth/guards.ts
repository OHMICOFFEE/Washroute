import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export type AppRole = 'customer' | 'driver' | 'admin'

export async function getSessionUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getUserRole(userId: string): Promise<AppRole | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).single()
  if (error || !data?.role) return null
  return data.role as AppRole
}

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthenticated' }, { status: 401 }) as NextResponse, user: null, role: null }
  const role = await getUserRole(user.id)
  return { user, role, error: null }
}

export async function requireRole(roles: AppRole[]) {
  const auth = await requireUser()
  if (auth.error) return auth
  if (!auth.role || !roles.includes(auth.role)) {
    return { ...auth, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) as NextResponse }
  }
  return auth
}

export async function assertBookingAccess(bookingId: string, userId: string, role: AppRole | null) {
  const supabase = createAdminClient()
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, customer_id, driver_id, status, total, delivery_pin_released')
    .eq('id', bookingId)
    .single()

  if (error || !booking) return { booking: null, error: NextResponse.json({ error: 'Booking not found' }, { status: 404 }) as NextResponse }

  const allowed = role === 'admin' || booking.customer_id === userId || booking.driver_id === userId
  if (!allowed) return { booking: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) as NextResponse }

  return { booking, error: null }
}
