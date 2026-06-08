import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/guards'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  licenseNumber: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const auth = await requireRole(['admin'])
    if (auth.error) return auth.error
    const input = schema.parse(await req.json())
    const supabase = createAdminClient()

    const { data, error } = await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName, role: 'driver' },
    })
    if (error || !data.user) throw error ?? new Error('Driver user was not created')

    await supabase.from('profiles').upsert({
      id: data.user.id,
      email: input.email,
      full_name: input.fullName,
      phone: input.phone ?? null,
      role: 'driver',
    })

    await supabase.from('drivers').upsert({
      id: data.user.id,
      license_number: input.licenseNumber ?? null,
      is_available: true,
    })

    return NextResponse.json({ ok: true, driverId: data.user.id })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create driver' }, { status: 500 })
  }
}
