// src/components/Navbar.jsx
'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  // --- STATE NOTIFIKASI BARU ---
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    let notifChannel; // Simpan referensi channel untuk di-cleanup

    const initializeAuthAndNotifs = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
        // 1. Ambil riwayat notifikasi (Maksimal 10 terbaru)
        const fetchNotifications = async () => {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(10)

          if (!error && data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.is_read).length)
          }
        }
        fetchNotifications()

        // 2. Pasang Telinga (Realtime Listener) untuk Notif Baru
        notifChannel = supabase
          .channel('realtime-notifs')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${currentUser.id}`
            },
            (payload) => {
              // Tambahkan notif baru ke urutan teratas
              setNotifications((prev) => [payload.new, ...prev].slice(0, 10))
              // Tambah angka merah di lonceng
              setUnreadCount((prev) => prev + 1)
            }
          )
          .subscribe()
      }
    }

    initializeAuthAndNotifs()

    // Pantau perubahan sesi (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setNotifications([])
        setUnreadCount(0)
      }
    })

    // Efek Scroll Navbar
    const handleScroll = () => {
        setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)

    // Deteksi klik di luar dropdown untuk menutupnya
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowDropdown(false)
        }
    }
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
        subscription.unsubscribe()
        window.removeEventListener('scroll', handleScroll)
        document.removeEventListener("mousedown", handleClickOutside)
        if (notifChannel) supabase.removeChannel(notifChannel)
    }
  }, [])

  // Fungsi menandai notifikasi sudah dibaca
  const markAsRead = async (notifId) => {
    // Optimistic update (Ubah di layar dulu biar cepat)
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))

    // Update di database
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId)
  }

  // Fungsi tandai semua sudah dibaca
  const markAllAsRead = async () => {
    if (unreadCount === 0 || !user) return;
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)

    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
  }

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200' : 'bg-white border-b border-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/" className="group flex items-center gap-1.5 md:gap-2">
            <div className="bg-blue-600 text-white p-1 md:p-1.5 rounded-lg group-hover:rotate-12 transition transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="md:w-5 md:h-5">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
            </div>
            <span className="text-lg md:text-2xl font-black text-gray-900 tracking-tight">
                Sparring<span className="text-blue-600">Futsal</span>
            </span>
        </Link>

        {/* MENU KANAN */}
        <div className="flex items-center gap-2 md:gap-3">
          
          {user ? (
            // === SUDAH LOGIN ===
            <div className="flex items-center gap-2 md:gap-4">
                
                {/* TOMBOL LONCENG NOTIFIKASI */}
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition focus:outline-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                        
                        {/* Red Badge (Hanya muncul jika ada pesan belum dibaca) */}
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-bounce-slow">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* DROPDOWN PESAN NOTIFIKASI */}
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform origin-top-right transition-all">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-bold text-gray-900">Notifikasi</h3>
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                                        Tandai dibaca
                                    </button>
                                )}
                            </div>
                            
                            <div className="max-h-[60vh] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500 text-sm">
                                        <div className="inline-block p-3 bg-gray-50 rounded-full mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
                                        </div>
                                        <p>Belum ada tantangan baru.</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div 
                                            key={notif.id} 
                                            onClick={() => {
                                                if(!notif.is_read) markAsRead(notif.id);
                                            }}
                                            className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-1">
                                                    {!notif.is_read ? (
                                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                    ) : (
                                                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={`text-sm ${!notif.is_read ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                                                        {new Date(notif.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-3 text-center border-t border-gray-100 bg-gray-50/50">
                                <Link href="/dashboard" onClick={() => setShowDropdown(false)} className="text-xs font-bold text-gray-500 hover:text-gray-900">
                                    Lihat Semua di Dashboard
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Link Buat Jadwal (Desktop) */}
                <Link 
                    href="/matches/create" 
                    className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Buat Jadwal
                </Link>

                {/* Profile Pill */}
                <Link href="/dashboard" className="flex items-center gap-2 p-1 md:pr-4 md:py-1 rounded-full border border-transparent md:border-gray-200 hover:border-blue-400 md:hover:bg-blue-50 transition group">
                    <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white">
                        {user.email?.[0].toUpperCase() || 'U'}
                    </div>
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