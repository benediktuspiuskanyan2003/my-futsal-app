import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import logger from '../../../lib/logger'

export async function GET(request) {
  // 1. Ambil URL dan Code
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Ambil parameter 'next' (tujuan), default ke dashboard jika tidak ada
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()

    // 2. Buat Client Supabase (Server Side)
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
              // Abaikan error ini di Route Handler
            }
          },
        },
      }
    )
    
    // 3. Tukar "Code" dari email menjadi "Session Login"
    logger.info('Auth callback: exchanging code for session', { next, page: 'auth/callback' })
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // BERHASIL: Redirect ke halaman tujuan
      logger.info('Auth callback: code exchange successful', { next, page: 'auth/callback' })
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      // GAGAL: Print error di Logs Vercel
      logger.error('Auth callback: code exchange failed', { 
        error: error.message, 
        next,
        page: 'auth/callback' 
      })
      console.error('Supabase Auth Error:', error)

      // Redirect ke Login + Tampilkan Pesan Error di URL
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  }

  // Jika tidak ada 'code' di URL sama sekali
  return NextResponse.redirect(`${origin}/login?error=no_code_provided`)
}