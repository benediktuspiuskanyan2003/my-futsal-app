// src/components/Navbar.jsx
'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    const handleScroll = () => {
        setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)

    return () => {
        subscription.unsubscribe()
        window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200' : 'bg-white border-b border-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
        
        {/* LOGO (Responsive Size) */}
        <Link href="/" className="group flex items-center gap-1.5 md:gap-2">
            {/* Icon: Lebih kecil di HP (w-8) */}
            <div className="bg-blue-600 text-white p-1 md:p-1.5 rounded-lg group-hover:rotate-12 transition transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="md:w-5 md:h-5">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
            </div>
            {/* Teks: Lebih kecil di HP (text-lg) */}
            <span className="text-lg md:text-2xl font-black text-gray-900 tracking-tight">
                Sparring<span className="text-blue-600">Futsal</span>
            </span>
        </Link>

        {/* MENU KANAN */}
        <div className="flex items-center gap-3">
          
          {user ? (
            // === SUDAH LOGIN ===
            <div className="flex items-center gap-3">
                
                {/* Link Buat Jadwal (Hanya muncul di Desktop) */}
                <Link 
                    href="/matches/create" 
                    className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Buat Jadwal
                </Link>

                {/* Profile Pill (Responsive) */}
                {/* Di HP: Jadi Lingkaran saja. Di Desktop: Jadi Kapsul ada tulisannya */}
                <Link href="/dashboard" className="flex items-center gap-2 p-1 md:pr-4 md:py-1 rounded-full border border-transparent md:border-gray-200 hover:border-blue-400 md:hover:bg-blue-50 transition group">
                    
                    {/* Avatar Circle */}
                    <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white">
                        {user.email?.[0].toUpperCase() || 'U'}
                    </div>
                    
                    {/* Text Dashboard (HIDDEN ON MOBILE) */}
                    <span className="hidden md:block text-sm font-bold text-gray-700 group-hover:text-blue-700">
                        Dashboard
                    </span>
                </Link>
            </div>
          ) : (
            // === BELUM LOGIN ===
            <div className="flex items-center">
                <Link href="/login" className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition shadow-lg shadow-gray-200 hover:shadow-gray-400 transform hover:-translate-y-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                    
                    {/* Teks Responsif */}
                    <span>
                        <span className="md:hidden">Masuk</span>
                        <span className="hidden md:inline">Masuk / Daftar</span>
                    </span>
                </Link>
            </div>
          )}

        </div>
      </div>
    </nav>
  )
}