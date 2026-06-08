import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function signIn(formData: FormData) {
  'use server'
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect('/login?error=Invalid%20login')
  redirect('/dashboard')
}

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form action={signIn} className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-black/30 p-6">
        <h1 className="text-2xl font-semibold text-white">Login</h1>
        {searchParams.error && <p className="text-sm text-red-400">{searchParams.error}</p>}
        <input name="email" type="email" required placeholder="Email" className="w-full rounded-lg p-3 text-black" />
        <input name="password" type="password" required placeholder="Password" className="w-full rounded-lg p-3 text-black" />
        <button className="w-full rounded-lg bg-white p-3 font-semibold text-black">Sign in</button>
      </form>
    </main>
  )
}
