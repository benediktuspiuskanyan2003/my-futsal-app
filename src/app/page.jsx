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
      let { data, error } = await supabase
        .from('matches')
        .select(`*, teams ( name, city, logo_url, skill_level )`)
        .eq('status', 'Open')
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
        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            
            {/* Teks Judul Besar */}
            <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
                    Cari Lawan Sparring? <br/>
                    <span className="text-blue-400">Gas Main Sekarang! ⚽</span>
                </h1>
                <p className="text-blue-200 text-lg max-w-xl mx-auto md:mx-0">
                    Jangan biarkan jadwal futsalmu kosong. Temukan tim lawan sepadan di kotamu dalam hitungan menit.
                </p>
            </div>

            {/* Kotak Filter (Sekarang ada di dalam Banner) */}
            <div className="bg-white p-4 rounded-xl shadow-lg w-full md:w-80 text-gray-900">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    Mau main di mana?
                </label>
                <select 
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="Semua Kota">🌍 Semua Kota</option>
                    {CITIES.map(city => (
                        <option key={city} value={city}>📍 {city}</option>
                    ))}
                </select>
                <div className="mt-3 text-xs text-gray-400 text-center">
                    Menampilkan {filteredMatches.length} jadwal aktif
                </div>
            </div>

        </div>
      </div>
      {/* --- AKHIR HERO SECTION --- */}


      {/* HASIL FILTER (CARD LIST) */}
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {loading ? (
             <div className="col-span-full text-center py-20 text-gray-500 animate-pulse">
                Sedang memuat jadwal...
             </div>
          ) : filteredMatches.length === 0 ? (
             // TAMPILAN JIKA TIDAK ADA JADWAL
             <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
               <p className="text-xl text-gray-600 font-medium">
                 Belum ada jadwal di <span className="text-blue-600 font-bold">{selectedCity}</span> 😔
               </p>
               <p className="text-sm text-gray-400 mt-2">Jadilah tim pertama yang membuat tantangan disini!</p>
             </div>
          ) : (
            // TAMPILKAN MATCH CARD
            filteredMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))
          )}
          
        </div>
      </div>

      {/* FAB Button (+) */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link href="/matches/create">
          <button className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-blue-700 hover:scale-105 transition transform duration-200">
            +
          </button>
        </Link>
      </div>

      {/* FOOTER */}
      <footer className="mt-20 border-t bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-xl font-black text-blue-600 mb-2">⚽ SparringFutsal</h2>
            <p className="text-gray-500 text-sm mb-6">Platform komunitas futsal di Indonesia.</p>
            <p className="text-gray-300 text-xs mt-8">
                &copy; {new Date().getFullYear()} SparringFutsal.
            </p>
        </div>
      </footer>

    </main>
  )
}