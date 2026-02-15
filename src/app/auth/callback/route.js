import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Ambil parameter 'next', jika tidak ada default ke '/dashboard'
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies() // Wajib await di Next.js 15/16

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Abaikan error ini jika dipanggil dari Server Component
            }
          },
        },
      }
    )
    
    // Tukar kode token menjadi session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Jika gagal, kembalikan ke halaman login/error
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}