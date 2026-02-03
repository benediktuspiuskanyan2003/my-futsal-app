// src/components/Navbar.jsx
'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase' // Pastikan path ini benar (mundur 1 langkah dari components)

export default function Navbar() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // 1. Cek status login saat pertama kali buka
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    // 2. Pasang "Penyadap" (Listener)
    // Supaya kalau user Login/Logout, tombol langsung berubah tanpa refresh halaman
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* LOGO (Kiri) */}
        <Link href="/" className="text-xl font-extrabold text-blue-600 flex items-center gap-2">
          ⚽ Sparring<span className="text-black">Futsal</span>
        </Link>

        {/* MENU (Kanan) */}
        <div className="flex items-center gap-4">
          
          {user ? (
            // === TAMPILAN KALAU SUDAH LOGIN ===
            <>
              <Link 
                href="/matches/create" 
                className="hidden md:block text-sm font-medium text-gray-500 hover:text-black"
              >
                + Buat Jadwal
              </Link>
              
              <Link href="/dashboard" className="flex items-center gap-2 bg-gray-100 py-1.5 px-3 rounded-full hover:bg-gray-200 transition">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {user.email[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700">Dashboard</span>
              </Link>
            </>
          ) : (
            // === TAMPILAN KALAU BELUM LOGIN ===
            <Link 
              href="/login" 
              className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition"
            >
              Masuk / Daftar
            </Link>
          )}

        </div>
      </div>
    </nav>
  )
}