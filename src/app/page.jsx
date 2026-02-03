// src/app/page.jsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import MatchCard from '../components/MatchCard'
import Link from 'next/link'
import { CITIES } from '../lib/cities' // <--- IMPORT DAFTAR KOTA

export default function Home() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  
  // STATE BARU: Untuk menyimpan kota yang dipilih user
  const [selectedCity, setSelectedCity] = useState('Semua Kota')

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      
      // 1. Ambil tanggal hari ini (Format: YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0]

      let { data, error } = await supabase
        .from('matches')
        .select(`*, teams ( name, city, logo_url, skill_level )`)
        .eq('status', 'Open')
        
        // --- FILTER BARU ---
        // Hanya tampilkan yang tanggal mainnya >= HARI INI
        .gte('play_date', today) 
        
        .order('play_date', { ascending: true })

      if (error) throw error
      if (data) setMatches(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // LOGIKA FILTER:
  const filteredMatches = selectedCity === 'Semua Kota' 
    ? matches 
    : matches.filter(match => match.teams.city === selectedCity)

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      
      {/* --- HERO SECTION (BANNER) --- */}
      {/* Bagian ini menggantikan header lama */}
      <div className="relative bg-blue-900 text-white py-16 md:py-24 px-4 overflow-hidden mb-8">
        
        {/* Gambar Background (Overlay) */}
        <div className="absolute inset-0 opacity-20">
            <img 
                src="https://images.unsplash.com/photo-1511886929837-354d827aae26?q=80&w=1964&auto=format&fit=crop" 
                alt="Futsal Background" 
                className="w-full h-full object-cover"
            />
        </div>

        {/* Konten Text & Filter */}
        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
            
            {/* Teks Judul Besar */}
            {/* Teks Judul Besar (Mobile Friendly) */}
            <div className="text-center md:text-left flex-1">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight text-white">
                    Cari Lawan Sparring? <br/>
                    
                    {/* Perbaikan: Gunakan 'block' di mobile agar baris baru, dan 'inline' di desktop */}
                    <span className="text-blue-400 block md:inline mt-2 md:mt-0">
                        Gas Main Sekarang!
                        
                        {/* Icon Petir: Ukuran responsif & posisi mengalir (inline-block) */}
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="currentColor" 
                            className="inline-block ml-2 -mt-1 w-8 h-8 md:w-12 md:h-12 text-yellow-400 animate-pulse align-middle"
                        >
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                        </svg>
                    </span>
                </h1>
                
                <p className="text-blue-100 text-lg md:text-xl max-w-xl mx-auto md:mx-0 font-medium opacity-90 leading-relaxed">
                    Jangan biarkan jadwal futsalmu kosong. Temukan tim lawan sepadan di kotamu dalam hitungan menit.
                </p>
            </div>

            {/* Kotak Filter (Glassmorphism / Clean Card) */}
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full md:w-96 text-gray-900 relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-100 rounded-md text-blue-600">
                        {/* Icon Search Kecil */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Mau main di mana?
                    </label>
                </div>

                {/* CUSTOM SELECT INPUT */}
                <div className="relative group">
                    {/* Icon Map Pin (Kiri) */}
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    </div>

                    <select 
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full pl-10 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none transition cursor-pointer hover:bg-gray-100"
                    >
                        <option value="Semua Kota">Semua Kota</option>
                        {CITIES.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>

                    {/* Icon Panah Bawah Custom (Kanan) */}
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                </div>

                {/* Info Counter */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 py-2 rounded-lg border border-gray-100">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Menampilkan {filteredMatches.length} jadwal aktif
                </div>
            </div>

        </div>
      </div>
      {/* --- AKHIR HERO SECTION --- */}


      {/* HASIL FILTER (CARD LIST) */}
      <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-[400px]">
        
        {/* LOGIKA TAMPILAN */}
        {loading ? (
             // --- 1. SKELETON LOADER (MODERN LOADING) ---
             // Kita tampilkan 6 kartu "palsu" yang berkedip
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm animate-pulse">
                        {/* Header Skeleton */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                        {/* Team Skeleton */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="space-y-2 flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                            </div>
                        </div>
                        {/* Detail Skeleton */}
                        <div className="space-y-2 mb-4">
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                        {/* Button Skeleton */}
                        <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                    </div>
                ))}
             </div>

        ) : filteredMatches.length === 0 ? (
             
             // --- 2. EMPTY STATE (MODERN UI) ---
             <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm mx-auto max-w-2xl">
                
                {/* Icon Search Besar (SVG) */}
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="11" y1="8" x2="11" y2="8"></line> {/* Titik kecil dekorasi */}
                    </svg>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Belum ada jadwal di <span className="text-blue-600">{selectedCity}</span>
                </h3>
                
                <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                    Sepertinya belum ada tim yang memposting jadwal di kota ini. 
                    Jadilah yang pertama membuka tantangan!
                </p>

                {/* Tombol CTA (Call to Action) */}
                <Link href="/matches/create" className="bg-black hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-95 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Buat Jadwal Baru
                </Link>

             </div>

        ) : (
            // --- 3. HASIL JADWAL (GRID) ---
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
            </div>
        )}
      </div>

      {/* FAB Button Modern (Fixed Bottom Right) */}
      <div className="fixed bottom-8 right-8 z-50 group">
        <Link href="/matches/create">
            
            {/* 1. TOOLTIP (Muncul saat mouse diarahkan/Hover) */}
            <div className="absolute right-full mr-4 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 shadow-xl whitespace-nowrap pointer-events-none">
                Buat Jadwal Baru
                {/* Panah kecil tooltip */}
                <div className="absolute top-1/2 -right-1 w-2 h-2 bg-gray-900 transform -translate-y-1/2 rotate-45"></div>
            </div>

            {/* 2. TOMBOL UTAMA */}
            <button className="relative w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl shadow-blue-600/40 flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:rotate-90 active:scale-95 border-4 border-white/10 backdrop-blur-sm">
                
                {/* Icon Plus (SVG) */}
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>

                {/* Efek Ping (Pulse) - Supaya user sadar tombol ini ada */}
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white"></span>
                </span>

            </button>
        </Link>
      </div>

      {/* FOOTER MODERN */}
      <footer className="bg-white border-t border-gray-200 mt-20 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                
                {/* 1. BRAND & DESKRIPSI */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        {/* Logo Icon Petir Kecil */}
                        <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                            </svg>
                        </div>
                        <span className="text-xl font-black text-gray-900 tracking-tight">SparringFutsal</span>
                    </div>
                    
                    {/* GANTI KALIMAT "NO.1" DENGAN INI: */}
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Solusi digital untuk anak futsal. Kami membantu tim kamu menemukan lawan tanding yang sepadan dengan mudah dan cepat.
                    </p>
                </div>

                {/* 2. NAVIGASI CEPAT */}
                <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Menu Utama</h3>
                    <ul className="space-y-3">
                        <li>
                            <Link href="/" className="text-gray-500 hover:text-blue-600 text-sm font-medium transition flex items-center gap-2">
                                Cari Lawan
                            </Link>
                        </li>
                        <li>
                            <Link href="/matches/create" className="text-gray-500 hover:text-blue-600 text-sm font-medium transition flex items-center gap-2">
                                Buat Jadwal Baru
                            </Link>
                        </li>
                        <li>
                            <Link href="/dashboard" className="text-gray-500 hover:text-blue-600 text-sm font-medium transition flex items-center gap-2">
                                Dashboard Tim
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* 3. DUKUNGAN / BANTUAN */}
                <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Bantuan</h3>
                    <ul className="space-y-3">
                        <li>
                            <a href="#" className="text-gray-500 hover:text-blue-600 text-sm font-medium transition">Panduan Penggunaan</a>
                        </li>
                        <li>
                            <a href="#" className="text-gray-500 hover:text-blue-600 text-sm font-medium transition">Syarat & Ketentuan</a>
                        </li>
                        <li>
                            <a href="#" className="text-gray-500 hover:text-blue-600 text-sm font-medium transition">Kebijakan Privasi</a>
                        </li>
                    </ul>
                </div>

                {/* 4. KONTAK & SOSMED */}
                <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Hubungi Kami</h3>
                    <div className="space-y-4">
                        {/* Tombol WA Admin */}
                        <a 
                            href="https://wa.me/6281234567890" // GANTI DENGAN NOMOR ANDA
                            target="_blank"
                            className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50 transition group"
                        >
                            <div className="bg-green-100 text-green-600 p-2 rounded-full group-hover:bg-green-500 group-hover:text-white transition">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold">Butuh Bantuan?</p>
                                <p className="text-sm font-bold text-gray-900">Chat Admin via WA</p>
                            </div>
                        </a>

                        {/* Social Icons (Instagram, dll) */}
                        <div className="flex gap-4">
                            <a href="#" className="text-gray-400 hover:text-pink-600 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            </a>
                            <a href="#" className="text-gray-400 hover:text-blue-500 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                            </a>
                        </div>
                    </div>
                </div>

            </div>

            {/* COPYRIGHT BOTTOM */}
            <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-gray-400 text-xs font-medium">
                    &copy; {new Date().getFullYear()} SparringFutsal. All rights reserved.
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>Dibuat dengan</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span>untuk Komunitas Futsal Indonesia.</span>
                </div>
            </div>
        </div>
      </footer>
    </main>
  )
}