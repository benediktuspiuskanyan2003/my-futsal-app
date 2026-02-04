// src/app/teams/[id]/page.jsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function PublicTeamProfile() {
  const params = useParams()
  const id = params?.id

  const [team, setTeam] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [manager, setManager] = useState(null)
  
  
  // State untuk Lightbox (Preview Gambar Fullscreen)
  const [previewImage, setPreviewImage] = useState(null)

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

      // 2. Ambil Data Manager
      if (teamData.manager_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', teamData.manager_id)
          .single()
        if (profileData) {
            let cleanNumber = profileData.whatsapp_number || ''
            
            // Hapus karakter non-angka (spasi, strip, dll)
            cleanNumber = cleanNumber.replace(/\D/g, '')
            if (cleanNumber.startsWith('0')) {
                cleanNumber = '62' + cleanNumber.slice(1)
            } else if (!cleanNumber.startsWith('62')) {
                cleanNumber = '62' + cleanNumber
            }
            setManager({
                ...profileData,
                whatsapp_number: cleanNumber
            })
        }
      }

      // 3. Ambil Jadwal Tim Ini
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .eq('team_id', id)
        .order('status', { ascending: false })
        .order('play_date', { ascending: false })
      
      setMatches(matchesData || [])

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // --- LOADING SKELETON (Modern) ---
  if (loading) return (
    <div className="min-h-screen bg-gray-50 pb-20 animate-pulse">
      <div className="h-56 md:h-72 bg-gray-200 w-full relative"></div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-300 rounded-full border-4 border-white -mt-20 md:-mt-28 flex-shrink-0"></div>
            <div className="flex-1 w-full space-y-4 mt-2 md:mt-0 text-center md:text-left">
                <div className="h-8 bg-gray-200 rounded-lg w-3/4 md:w-1/2 mx-auto md:mx-0"></div>
                <div className="flex justify-center md:justify-start gap-2">
                    <div className="h-8 bg-gray-200 rounded-lg w-24"></div>
                    <div className="h-8 bg-gray-200 rounded-lg w-24"></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )

  // --- NOT FOUND STATE ---
  if (!team) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="11" y1="14" x2="11.01" y2="14"></line></svg>
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Tim Tidak Ditemukan</h1>
        <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">Waduh, sepertinya tim yang kamu cari sudah bubar atau link-nya salah.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition transform hover:-translate-y-1">
            Kembali ke Beranda
        </Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-20">
      
      {/* --- LIGHTBOX (POPUP GAMBAR) --- */}
      {previewImage && (
        <div 
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-fade-in"
            onClick={() => setPreviewImage(null)}
        >
            <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
                <img 
                    src={previewImage} 
                    alt="Full Preview" 
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                />
                <button className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        </div>
      )}

      {/* --- HERO BANNER --- */}
      <div className="h-56 md:h-80 relative bg-gray-900 group overflow-hidden">
        {team.banner_url ? (
            <img 
                src={team.banner_url} 
                alt="Sampul Tim" 
                className="w-full h-full object-cover opacity-90 transition transform group-hover:scale-105 cursor-zoom-in" 
                onClick={() => setPreviewImage(team.banner_url)}
            />
        ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                <span className="text-white/10 font-black text-7xl md:text-9xl uppercase tracking-tighter select-none z-10">TEAM</span>
            </div>
        )}
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-transparent to-transparent pointer-events-none"></div>
        
        {/* Tombol Kembali (Mobile Friendly) */}
        <Link href="/" className="absolute top-4 left-4 md:top-6 md:left-6 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-full transition font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Kembali
        </Link>
      </div>

      {/* --- KONTEN UTAMA --- */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 md:-mt-32 relative z-10">
        
        {/* --- KARTU PROFIL UTAMA --- */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start text-center md:text-left">
            
            {/* Logo Besar (Clickable) */}
            <div 
                className="w-32 h-32 md:w-48 md:h-48 bg-white rounded-full p-2 shadow-xl -mt-20 md:-mt-28 flex-shrink-0 cursor-zoom-in transition hover:scale-105"
                onClick={() => team.logo_url && setPreviewImage(team.logo_url)}
            >
                <div className="w-full h-full bg-gray-50 rounded-full overflow-hidden flex items-center justify-center border-4 border-white relative shadow-inner">
                    {team.logo_url ? (
                        <img src={team.logo_url} className="w-full h-full object-cover" alt="Logo" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
                    )}
                </div>
            </div>

            {/* Info Tim */}
            <div className="flex-1 w-full pt-2">
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">{team.name}</h1>
                
                {/* Badges (Full SVG) */}
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-8">
                    
                    {/* Badge Kota */}
                    <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700 text-sm font-bold border border-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        {team.city}
                    </div>

                    {/* Badge Homebase */}
                    {team.homebase && (
                        <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700 text-sm font-bold border border-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                            {team.homebase}
                        </div>
                    )}

                    {/* Badge Skill */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border ${
                        team.skill_level === 'Pro' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                        team.skill_level === 'Intermediate' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                        'bg-yellow-50 text-yellow-700 border-yellow-100'
                    }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                        {team.skill_level || 'Fun'}
                    </div>
                </div>

                {/* Tampilkan Card Manager HANYA jika data manager sudah ter-load */}
{manager && (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-4 flex items-center gap-4 text-left max-w-md mx-auto md:mx-0 shadow-sm hover:shadow-md transition">
        
        {/* Avatar Manager */}
        <div className="w-12 h-12 bg-white text-green-600 rounded-full flex items-center justify-center text-xl shadow-sm border border-green-100 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </div>

        <div className="min-w-0">
            <p className="text-[10px] text-green-800 font-bold uppercase tracking-widest mb-0.5">Manager Tim</p>
            
            {/* Nama Manager */}
            <p className="font-bold text-gray-900 truncate mb-1">
                {manager.full_name || 'Tanpa Nama'}
            </p>

            {/* Tombol WA */}
            <a 
                // Pastikan manager.whatsapp_number sudah diformat di logic fetch di atas
                href={`https://wa.me/${manager.whatsapp_number}`} 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-full transition shadow-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                Chat WhatsApp
            </a>
        </div>
    </div>
)}
            </div>
        </div>

        {/* --- DAFTAR JADWAL (CARD MODERN) --- */}
        <div className="mt-12">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>
                <h2 className="text-2xl font-black text-gray-900">Jadwal Pertandingan</h2>
            </div>
            
            {matches.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <p className="text-gray-900 font-bold mb-1">Belum ada jadwal aktif</p>
                    <p className="text-gray-500 text-sm">Tim ini sedang tidak mencari lawan sparring.</p>
                </div>
            ) : (
                <div className="grid gap-5 md:grid-cols-2">
                    {matches.map(m => (
                        <Link key={m.id} href={`/matches/${m.id}`}>
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition group cursor-pointer h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-50 text-blue-700 w-12 h-12 rounded-xl flex flex-col items-center justify-center border border-blue-100">
                                                <span className="text-[10px] font-bold uppercase">{new Date(m.play_date).toLocaleString('default', { month: 'short' })}</span>
                                                <span className="text-xl font-black leading-none">{new Date(m.play_date).getDate()}</span>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Kick-off</p>
                                                <p className="font-bold text-gray-900">{m.play_time.slice(0,5)} WIB</p>
                                            </div>
                                        </div>
                                        
                                        {m.status === 'Open' ? (
                                            <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 border border-green-200">
                                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                Open
                                            </span>
                                        ) : (
                                            <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full font-bold border border-gray-200">
                                                Closed
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-start gap-2.5 text-gray-600 text-sm mb-6 bg-gray-50 p-3 rounded-xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                        <span className="font-medium line-clamp-2">{m.location_name}</span>
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Detail Pertandingan</span>
                                    <span className="text-blue-600 text-sm font-bold group-hover:translate-x-1 transition flex items-center gap-1">
                                        Lihat
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                    </span>
                                </div>
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