import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole, assertBookingAccess } from '@/lib/auth/guards'

const metaSchema = z.object({
  bookingId: z.string().uuid(),
  photoType: z.enum(['before', 'after', 'fuel_receipt', 'damage', 'odometer']),
})

const MAX_FILE_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])

export async function POST(req: Request) {
  try {
    const auth = await requireRole(['driver', 'admin'])
    if (auth.error) return auth.error
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const parsed = metaSchema.parse({ bookingId: formData.get('bookingId'), photoType: formData.get('photoType') })

    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: 'File too large' }, { status: 400 })
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })

    const access = await assertBookingAccess(parsed.bookingId, auth.user!.id, auth.role)
    if (access.error) return access.error
    if (auth.role === 'driver' && access.booking!.driver_id !== auth.user!.id) {
      return NextResponse.json({ error: 'Driver is not assigned to this booking' }, { status: 403 })
    }

    const supabase = createAdminClient()
    const bucket = parsed.photoType === 'fuel_receipt' ? 'receipts' : 'booking-photos'
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const path = `${parsed.bookingId}/${parsed.photoType}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false })
    if (uploadError) throw uploadError

    const { error: dbError } = await supabase.from('booking_photos').insert({
      booking_id: parsed.bookingId,
      photo_type: parsed.photoType,
      storage_path: path,
      storage_bucket: bucket,
      file_name: file.name,
      file_size: file.size,
      uploaded_by: auth.user!.id,
    })
    if (dbError) throw dbError

    return NextResponse.json({ ok: true, path, bucket })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Upload failed' }, { status: 500 })
  }
}
