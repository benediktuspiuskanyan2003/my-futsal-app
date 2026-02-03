// src/app/teams/[id]/page.jsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { useParams } from 'next/navigation' // Pakai useParams biar aman

export default function PublicTeamProfile() {
  const params = useParams()
  const id = params?.id

  const [team, setTeam] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [manager, setManager] = useState(null)

  useEffect(() => {
    if (id) fetchTeamData()
  }, [id])

  const fetchTeamData = async () => {
    try {
      setLoading(true)

      // 1. Ambil Data Tim
      const { data: teamData, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setTeam(teamData)

      // 2. Ambil Data Manager (untuk dapat No WA)
      if (teamData.manager_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', teamData.manager_id)
          .single()
        setManager(profileData)
      }

      // 3. Ambil Jadwal Tim Ini
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .eq('team_id', id)
        .order('status', { ascending: false }) // Open dulu
        .order('play_date', { ascending: false }) // Tanggal terbaru
      
      setMatches(matchesData || [])

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // --- 1. MODERN LOADING STATE (SKELETON) ---
  if (loading) return (
    <div className="min-h-screen bg-gray-50 pb-20 animate-pulse">
      {/* Skeleton Banner */}
      <div className="h-48 md:h-64 bg-gray-200 w-full relative"></div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
            
            {/* Skeleton Avatar */}
            <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-300 rounded-full border-4 border-white -mt-16 md:-mt-24 flex-shrink-0 mx-auto md:mx-0"></div>

            {/* Skeleton Info Tim */}
            <div className="flex-1 w-full space-y-4 mt-2 md:mt-0">
                <div className="h-8 bg-gray-200 rounded w-3/4 md:w-1/2 mx-auto md:mx-0"></div>
                <div className="flex justify-center md:justify-start gap-2">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
            </div>
        </div>

        {/* Skeleton Grid Jadwal */}
        <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  )

  // --- 2. MODERN NOT FOUND STATE (ERROR UI) ---
  if (!team) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        {/* Icon Not Found (Search Cross) */}
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="11" y1="14" x2="11.01" y2="14"></line>
            </svg>
        </div>
        
        <h1 className="text-3xl font-black text-gray-900 mb-2">Tim Tidak Ditemukan</h1>
        <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">
            Waduh, sepertinya tim yang kamu cari sudah bubar atau link-nya salah.
        </p>

        <Link href="/" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition transform hover:-translate-y-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Kembali ke Beranda
        </Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* --- HERO BANNER (Sama kayak Dashboard tapi tanpa tombol edit) --- */}
      <div className="h-48 md:h-64 relative bg-gray-900 group overflow-hidden">
        {team.banner_url ? (
            <img src={team.banner_url} alt="Sampul Tim" className="w-full h-full object-cover" />
        ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-700 to-indigo-800 flex items-center justify-center">
                <span className="text-white/20 font-bold text-6xl uppercase tracking-widest select-none">TEAM</span>
            </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        
        {/* Tombol Kembali */}
        <Link href="/" className="absolute top-6 left-6 bg-white/20 hover:bg-white/40 text-white px-4 py-2 rounded-full backdrop-blur-sm transition font-bold text-sm">
            &larr; Kembali ke Beranda
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        
        {/* --- KARTU PROFIL UTAMA --- */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
            
            {/* Logo Besar */}
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full p-2 shadow-xl -mt-16 md:-mt-24 flex-shrink-0 mx-auto md:mx-0">
                <div className="w-full h-full bg-gray-100 rounded-full overflow-hidden flex items-center justify-center text-5xl border border-gray-100">
                    {team.logo_url ? <img src={team.logo_url} className="w-full h-full object-cover" /> : <span>⚽</span>}
                </div>
            </div>

            {/* Info Tim */}
            <div className="flex-1 text-center md:text-left w-full">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">{team.name}</h1>
                
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-sm text-gray-600 font-medium mb-6">
                    <span className="bg-gray-100 px-3 py-1 rounded-full">📍 {team.city}</span>
                    {team.homebase && <span className="bg-gray-100 px-3 py-1 rounded-full">🏠 {team.homebase}</span>}
                    <span className={`px-3 py-1 rounded-full ${
                        team.skill_level === 'Pro' ? 'bg-purple-100 text-purple-700' : 
                        team.skill_level === 'Intermediate' ? 'bg-blue-100 text-blue-700' : 
                        'bg-yellow-100 text-yellow-700'
                    }`}>⚡ {team.skill_level || 'Fun'}</span>
                </div>

                {/* Info Manager (Kontak) */}
                {manager && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-flex items-center gap-4 text-left">
                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl">📞</div>
                        <div>
                            <p className="text-xs text-green-800 font-bold uppercase tracking-wider">Manager</p>
                            <p className="font-bold text-gray-900">{manager.full_name}</p>
                            <a 
                                href={`https://wa.me/${manager.whatsapp_number}`} 
                                target="_blank"
                                className="text-xs text-green-600 underline hover:text-green-800"
                            >
                                {manager.whatsapp_number} (Chat WA)
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* --- DAFTAR JADWAL MEREKA --- */}
        <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Jadwal Pertandingan</h2>
            
            {matches.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-400 text-lg">Belum ada jadwal aktif.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {matches.map(m => (
                        <Link key={m.id} href={`/matches/${m.id}`}>
                            <div className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition group cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-gray-900 text-lg">{m.play_date}</span>
                                    {m.status === 'Open' ? (
                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">Open</span>
                                    ) : (
                                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full font-bold">Closed</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">{m.play_time.slice(0,5)} WIB</span>
                                    <span>di {m.location_name}</span>
                                </div>
                                <span className="text-blue-600 text-sm font-bold group-hover:underline">Lihat Detail &rarr;</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>

      </div>
    </div>
  )
}