import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  
  // 1. Ambil 'code' (tiket) dari URL link email
  const code = requestUrl.searchParams.get('code')
  
  // 2. Ambil tujuan 'next' (misal: /update-password). Default ke dashboard jika tidak ada.
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    // 3. Tukar 'code' menjadi Session User yang sah di server
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // 4. Redirect user ke halaman tujuan (update-password)
  return NextResponse.redirect(`${requestUrl.origin}${next}`)
}