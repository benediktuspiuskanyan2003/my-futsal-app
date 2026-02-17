// src/lib/supabase.js
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Gunakan createBrowserClient (bukan createClient biasa)
// Ini otomatis mengatur penyimpanan token & PKCE verifier ke dalam COOKIES browser.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)