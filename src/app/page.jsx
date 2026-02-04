// src/app/page.jsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import MatchCard from '../components/MatchCard'
import Link from 'next/link'
import { CITIES } from '../lib/cities'

export default function Home() {
  const [activeTab, setActiveTab] = useState('matches')
  const [teams, setTeams] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCity, setSelectedCity] = useState('Semua Kota')

  // --- USE EFFECT ---
  useEffect(() => {
    if (activeTab === 'matches') {
      fetchMatches()
    } else {
      fetchTeams()
    }
  }, [activeTab])

  // --- FETCH TEAMS (PERBAIKAN DI SINI) ---
  const fetchTeams = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        // .eq('is_deleted', false) <--- INI DIHAPUS KARENA KOLOMNYA TIDAK ADA DI TABEL TEAMS
        .order('is_verified', { ascending: false }) // Prioritaskan yang Verified
        .order('name', { ascending: true }) // Urutkan A-Z

      if (error) throw error
      setTeams(data || [])
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }

  // --- HELPER: CEK NEWBIE ---
  const isNewbie = (dateString) => {
      const joinedDate = new Date(dateString)
      const now = new Date()
      const diffDays = Math.ceil(Math.abs(now - joinedDate) / (1000 * 60 * 60 * 24))
      return diffDays <= 30
  }

  // --- FILTER TEAMS ---
  const filteredTeams = selectedCity === 'Semua Kota'
    ? teams
    : teams.filter(team => team.city === selectedCity)

  // --- FETCH MATCHES ---
  const fetchMatches = async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]

      let { data, error } = await supabase
        .from('matches')
        .select(`*, teams ( name, city, logo_url, skill_level, is_verified )`)
        .eq('status', 'Open')
        .eq('is_deleted', false) // Kalau di matches, kolom ini ADA. Jadi aman.
        .gte('play_date', today) 
        .order('play_date', { ascending: true })

      if (error) throw error
      setMatches(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // --- FILTER MATCHES ---
  const filteredMatches = selectedCity === 'Semua Kota' 
    ? matches 
    : matches.filter(match => match.teams.city === selectedCity)

  // ================= TAMPILAN (RETURN) =================
  return (
    <main className="min-h-screen bg-gray-50 pb-20 pt-16">
      
      {/* --- HERO SECTION --- */}
      <div className="relative bg-blue-900 text-white py-16 md:py-24 px-4 overflow-hidden mb-8">
        <div className="absolute inset-0 opacity-20">
            <img src="https://images.unsplash.com/photo-1511886929837-354d827aae26?q=80&w=1964&auto=format&fit=crop" alt="Background" className="w-full h-full object-cover"/>
        </div>

        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="text-center md:text-left flex-1">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight text-white">
                    Cari Lawan Sparring? <br/>
                    <span className="text-blue-400 block md:inline mt-2 md:mt-0">
                        Gas Main Sekarang!
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="inline-block ml-2 -mt-1 w-8 h-8 md:w-12 md:h-12 text-yellow-400 animate-pulse align-middle"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                    </span>
                </h1>
                <p className="text-blue-100 text-lg md:text-xl max-w-xl mx-auto md:mx-0 font-medium opacity-90 leading-relaxed">
                    Jangan biarkan jadwal futsalmu kosong. Temukan tim lawan sepadan di kotamu.
                </p>
            </div>

            {/* Filter Kota */}
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full md:w-96 text-gray-900 relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-100 rounded-md text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mau main di mana?</label>
                </div>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>
                    <select 
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full pl-10 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                    >
                        <option value="Semua Kota">Semua Kota</option>
                        {CITIES.map(city => (<option key={city} value={city}>{city}</option>))}
                    </select>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 py-2 rounded-lg border border-gray-100">
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                    {activeTab === 'matches' ? `Menampilkan ${filteredMatches.length} jadwal` : `Menampilkan ${filteredTeams.length} tim`}
                </div>
            </div>
        </div>
      </div>

      {/* --- TAB SWITCHER --- */}
      <div className="max-w-5xl mx-auto px-4 mb-8 -mt-16 relative z-30">
         <div className="bg-white p-2 rounded-2xl shadow-xl border border-gray-100 flex gap-2 max-w-md mx-auto md:mx-0">
            <button onClick={() => setActiveTab('matches')} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'matches' ? 'bg-blue-600 text-white shadow-lg' : 'bg-transparent text-gray-500 hover:bg-gray-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> Jadwal Sparring
            </button>
            <button onClick={() => setActiveTab('teams')} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'teams' ? 'bg-blue-600 text-white shadow-lg' : 'bg-transparent text-gray-500 hover:bg-gray-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Daftar Tim
            </button>
         </div>
      </div>

      {/* --- CONTENT AREA (LOGIC UTAMA) --- */}
      <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-[400px]">
        {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (<div key={i} className="bg-white h-48 rounded-xl border border-gray-100 shadow-sm animate-pulse"></div>))}
             </div>
        ) : (
            <>
                {/* --- BAGIAN 1: JIKA TAB MATCHES AKTIF --- */}
                {activeTab === 'matches' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMatches.length === 0 ? (
                            
                            // --- MODERN EMPTY STATE ---
                            <div className="col-span-full flex flex-col items-center justify-center text-center py-20 px-6 bg-white rounded-3xl border-2 border-dashed border-gray-200 hover:border-blue-200 transition-colors duration-300">
                                
                                {/* 1. Icon Ilustrasi Besar */}
                                <div className="relative mb-6 group">
                                    {/* Circle Background */}
                                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 transition-transform transform group-hover:scale-110 duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                            <path d="M8 14h.01"></path>
                                            <path d="M12 14h.01"></path>
                                            <path d="M16 14h.01"></path>
                                            <path d="M8 18h.01"></path>
                                            <path d="M12 18h.01"></path>
                                            <path d="M16 18h.01"></path>
                                        </svg>
                                    </div>
                                    
                                    {/* Badge Tanya (?) Kecil */}
                                    <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-sm">
                                        <div className="bg-yellow-400 text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white font-bold text-lg">
                                            ?
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Teks Heading & Deskripsi */}
                                <h3 className="text-2xl font-black text-gray-900 mb-2">
                                    Sepi banget di <span className="text-blue-600 underline decoration-wavy decoration-blue-300 underline-offset-4">{selectedCity}</span>
                                </h3>
                                <p className="text-gray-500 max-w-md mx-auto mb-8 text-base leading-relaxed">
                                    Belum ada tim yang memposting jadwal sparring di kota ini. 
                                    Jadilah tim pertama yang membuka tantangan! 🏆
                                </p>

                                {/* 3. Tombol CTA Modern */}
                                <Link 
                                    href="/matches/create" 
                                    className="group relative inline-flex items-center gap-3 bg-gray-900 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-blue-200 transform hover:-translate-y-1"
                                >
                                    {/* Icon Plus */}
                                    <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                    </div>
                                    <span>Buat Jadwal Baru</span>
                                </Link>

                            </div>
                        ) : (
                            // --- LIST JADWAL (GRID) ---
                            filteredMatches.map(m => <MatchCard key={m.id} match={m} />)
                        )}
                    </div>
                )}

                {/* --- BAGIAN 2: JIKA TAB TEAMS AKTIF --- */}
                {/* --- BAGIAN 2: JIKA TAB TEAMS AKTIF --- */}
{activeTab === 'teams' && (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.length === 0 ? (
            
            // --- MODERN EMPTY STATE (TEAMS) ---
            <div className="col-span-full flex flex-col items-center justify-center text-center py-20 px-6 bg-white rounded-3xl border-2 border-dashed border-gray-200 hover:border-purple-200 transition-colors duration-300">
                
                {/* 1. Icon Ilustrasi Besar (Nuansa Ungu) */}
                <div className="relative mb-6 group">
                    {/* Circle Background */}
                    <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center text-purple-500 transition-transform transform group-hover:scale-110 duration-300">
                        {/* Icon Shield / Team */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            <path d="M12 8v4"></path>
                            <path d="M12 16h.01"></path>
                        </svg>
                    </div>
                    
                    {/* Badge Plus (+) Kecil */}
                    <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-sm">
                        <div className="bg-gray-900 text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white font-bold text-lg">
                            +
                        </div>
                    </div>
                </div>

                {/* 2. Teks Heading & Deskripsi */}
                <h3 className="text-2xl font-black text-gray-900 mb-2">
                    Wah, <span className="text-purple-600 underline decoration-wavy decoration-purple-300 underline-offset-4">{selectedCity}</span> masih kosong!
                </h3>
                <p className="text-gray-500 max-w-md mx-auto mb-8 text-base leading-relaxed">
                    Belum ada tim futsal yang mendarat di kota ini. 
                    Ini kesempatan emas buat tim kamu jadi penguasa kota! 👑
                </p>

                {/* 3. Tombol CTA (Arahkan ke Dashboard untuk buat profil) */}
                <Link 
                    href="/dashboard" 
                    className="group relative inline-flex items-center gap-3 bg-gray-900 hover:bg-purple-600 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-purple-200 transform hover:-translate-y-1"
                >
                    {/* Icon User Plus */}
                    <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                    </div>
                    <span>Daftarkan Tim Saya</span>
                </Link>

            </div>
        ) : (
            // --- LIST TIM (GRID) ---
            filteredTeams.map(team => (
                <Link key={team.id} href={`/teams/${team.id}`}>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 transition-all duration-300 cursor-pointer relative h-full flex flex-col items-center text-center group">
                        
                        {/* ... (SISA KODINGAN CARD TIM ANDA YANG SUDAH BAGUS TADI) ... */}
                        {/* Copy Paste bagian dalam map card tim yang sebelumnya di sini */}
                        
                        {/* Badges Container */}
                        <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10">
                            {team.is_verified && (
                                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-md shadow-blue-200">
                                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> 
                                    VERIFIED
                                </span>
                            )}
                            {isNewbie(team.created_at) && (
                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-lg border border-green-200">
                                    🌱 NEWBIE
                                </span>
                            )}
                        </div>

                        {/* Avatar Tim */}
                        <div className="w-24 h-24 bg-gray-50 rounded-full border-4 border-white shadow-lg overflow-hidden mb-5 group-hover:scale-110 transition duration-300">
                            {team.logo_url ? (
                                <img src={team.logo_url} className="w-full h-full object-cover"/>
                            ) : (
                                <span className="flex items-center justify-center h-full text-3xl">🛡️</span>
                            )}
                        </div>

                        {/* Info Tim */}
                        <h3 className="font-black text-xl text-gray-900 mb-1 group-hover:text-blue-600 transition">
                            {team.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6 font-medium flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> 
                            {team.city}
                        </p>
                        
                        {/* Tags / Level (Bottom) */}
                        <div className="mt-auto w-full pt-4 border-t border-gray-100 flex justify-center gap-2">
                            <span className="px-4 py-1.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-700">
                                Level: {team.skill_level || 'Fun'}
                            </span>
                        </div>

                    </div>
                </Link>
            ))
        )}
    </div>
)}
            </>
        )}
      </div>

      {/* FAB Button */}
      <div className="fixed bottom-8 right-8 z-50 group">
        <Link href="/matches/create">
            <button className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center transform hover:scale-110 active:scale-95 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
        </Link>
      </div>

    </main>
  )
}