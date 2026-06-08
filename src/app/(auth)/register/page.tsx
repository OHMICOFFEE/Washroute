import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function register(formData: FormData) {
  'use server'
  const fullName = String(formData.get('fullName') ?? '')
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const supabase = createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role: 'customer' } },
  })
  if (error) redirect('/register?error=Could%20not%20register')
  redirect('/dashboard')
}

export default function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form action={register} className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-black/30 p-6">
        <h1 className="text-2xl font-semibold text-white">Create account</h1>
        {searchParams.error && <p className="text-sm text-red-400">{searchParams.error}</p>}
        <input name="fullName" required placeholder="Full name" className="w-full rounded-lg p-3 text-black" />
        <input name="email" type="email" required placeholder="Email" className="w-full rounded-lg p-3 text-black" />
        <input name="password" type="password" minLength={8} required placeholder="Password" className="w-full rounded-lg p-3 text-black" />
        <button className="w-full rounded-lg bg-white p-3 font-semibold text-black">Register</button>
      </form>
    </main>
  )
}
