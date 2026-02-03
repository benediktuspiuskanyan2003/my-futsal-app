// src/app/matches/[id]/page.jsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams } from 'next/navigation' 
import Link from 'next/link'

export default function MatchDetail() { 
  const params = useParams()
  const id = params?.id

  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [managerPhone, setManagerPhone] = useState('') 

  useEffect(() => {
    if (id) fetchMatchDetail()
  }, [id])

  const fetchMatchDetail = async () => {
    try {
      setLoading(true)
      
      const { data: matchData, error } = await supabase
        .from('matches')
        .select(`
          *,
          teams (
            id,
            name,
            city,
            logo_url,
            skill_level,
            manager_id
          )
        `)
        .eq('id', id) 
        .single()

      if (error) throw error
      setMatch(matchData)

      if (matchData?.teams?.manager_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('whatsapp_number')
          .eq('id', matchData.teams.manager_id)
          .single()

        let noWaFormat = profileData?.whatsapp_number || ''
        if (noWaFormat.startsWith('0')) {
          noWaFormat = '62' + noWaFormat.slice(1)
        } else if (noWaFormat && !noWaFormat.startsWith('62')) {
          noWaFormat = '62' + noWaFormat
        }

        
        if (profileData) setManagerPhone(noWaFormat)
      }

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleContactWA = () => {
    if (!managerPhone) return alert("Nomor WA belum diatur oleh pemilik tim.")
    const message = `Halo ${match.teams.name}, saya lihat jadwal sparring tanggal ${match.play_date} di ${match.location_name}. Masih open slot?`
    const url = `https://wa.me/${managerPhone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  // --- FUNGSI BARU: SHARE KE GRUP WA ---
  const handleShare = () => {
    // 1. Ambil URL halaman saat ini
    const currentUrl = window.location.href

    // 2. Buat kata-kata ajakan yang seru
    const text = `Woy guys! Tim ${match.teams.name} ngajak sparring nih!\n\n📅 Tgl: ${match.play_date}\n⏰ Jam: ${match.play_time.slice(0,5)} WIB\n📍 Lokasi: ${match.location_name}\n\nGas gak? Cek detailnya disini: ${currentUrl}`

    // 3. Buka WhatsApp
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(waUrl, '_blank')
  }

  if (loading) return <div className="p-10 text-center">Memuat detail...</div>
  if (!match) return <div className="p-10 text-center">Jadwal tidak ditemukan 😔</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10 flex justify-center items-start">
        
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        
        {/* HEADER */}
        <div className="bg-gray-900 text-white p-6 flex justify-between items-center">
            <div>
                <p className="text-gray-400 text-sm">Jadwal Pertandingan</p>
                <h1 className="text-2xl font-bold">{match.play_date}</h1>
            </div>
            <div className="text-right">
                <div className="text-3xl font-bold text-blue-400">{match.play_time.slice(0,5)}</div>
                <p className="text-xs text-gray-400 uppercase">WIB</p>
            </div>
        </div>

        {/* BODY CONTENT */}
        <div className="p-6 md:p-8 space-y-8">
            
            {/* 1. IDENTITAS TIM */}
            <Link href={`/teams/${match.teams.id}`} className="group block">
                <div className="flex items-center gap-5 hover:bg-gray-50 p-3 -m-3 rounded-xl transition">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-4xl shrink-0 overflow-hidden border border-gray-100 group-hover:border-blue-300">
                    {match.teams?.logo_url ? <img src={match.teams.logo_url} className="w-full h-full object-cover"/> : '⚽'}
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-bold tracking-wide uppercase">Host Team</p>
                        <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition">{match.teams?.name}</h2>
                        <p className="text-gray-500">{match.teams?.city}</p>
                        
                        <div className="mt-2">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                match.teams?.skill_level === 'Pro' ? 'bg-purple-100 text-purple-700' : 
                                match.teams?.skill_level === 'Intermediate' ? 'bg-blue-100 text-blue-700' : 
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                                ⚡ Skill: {match.teams?.skill_level || 'Fun'}
                            </span>
                        </div>
                    </div>
                </div>
            </Link>

            <hr className="border-gray-100" />

            {/* 2. DETAIL LAPANGAN & BIAYA */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">Lokasi / Lapangan</p>
                    <p className="font-bold text-lg text-gray-800">📍 {match.location_name}</p>
                    <p className="text-sm mt-1">
                        {match.is_venue_booked ? 
                            <span className="text-green-600 font-bold">✅ Sudah Booking</span> : 
                            <span className="text-orange-600 font-bold">⚠️ Cari Bareng / Belum Booking</span>
                        }
                    </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">Sistem Pembayaran</p>
                    <p className="font-bold text-lg text-gray-800">💰 {match.fee_type}</p>
                    <p className="text-sm text-gray-500 mt-1">
                        {match.fee_type === 'Split' ? 'Bayar Patungan (50:50)' : 
                         match.fee_type === 'LoserPays' ? 'Yang Kalah Bayar Lapangan' : 
                         'Tuan Rumah yang Bayar'}
                    </p>
                </div>
            </div>

            {/* 3. TOMBOL AKSI (WA & SHARE) */}
            <div className="pt-4 space-y-3">
                {/* Kontak Lawan (Utama) */}
                <button 
                    onClick={handleContactWA}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-4 rounded-xl shadow-lg shadow-green-200 transition flex items-center justify-center gap-2"
                >
                    <span>💬</span> Hubungi Lawan (WhatsApp)
                </button>
                
                {/* Tombol Share (Baru) */}
                <button 
                    onClick={handleShare}
                    className="w-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 text-lg font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                    <span>📤</span> Bagikan ke Grup WA
                </button>
                
                <Link href="/" className="block text-center text-gray-500 font-bold hover:text-black py-2">
                    &larr; Kembali cari lawan lain
                </Link>
            </div>

        </div>
      </div>
    </div>
  )
}