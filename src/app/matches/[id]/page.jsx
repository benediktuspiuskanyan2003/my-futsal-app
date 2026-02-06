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

  const [notification, setNotification] = useState(null)
  const [currentUser, setCurrentUser] = useState(null) // <--- INI SOLUSINYA
  const [previewImage, setPreviewImage] = useState(null) // Untuk Lightbox

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
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
      // 1. Cek Ketersediaan Nomor
      if (!managerPhone) {
          setNotification({
             type: 'error', // Supaya warnanya merah
             title: 'Nomor Tidak Tersedia',
             message: 'Maaf, nomor WhatsApp manager tim ini belum diatur oleh pemiliknya.'
          })
          return
      }
      
      // 2. AUTO-FORMAT NOMOR HP (Penting!)
      // Mengubah '0812...' menjadi '62812...' agar link WA berfungsi
      let phone = managerPhone.toString().trim()
      
      // Hapus karakter non-angka (jika user iseng nulis "0812-3456")
      phone = phone.replace(/\D/g, '')

      if (phone.startsWith('0')) {
          phone = '62' + phone.slice(1)
      }

      // 3. SUSUN PESAN YANG LEBIH RAPI & LENGKAP
      // Gunakan \n untuk enter (baris baru)
      let message = `Halo Manager Tim *${match.teams.name}*! 👋\n\n`
      message += `Saya melihat jadwal sparring Anda di aplikasi:\n`
      message += `📅 Tanggal: *${match.play_date}*\n`
      message += `⏰ Jam: *${match.play_time.slice(0, 5)} WIB*\n`
      message += `📍 Lokasi: ${match.location_name}\n`
      
      // Tambahkan detail sistem bayar biar jelas di awal
      const feeLabel = match.fee_type === 'Split' ? 'Patungan (Split)' : match.fee_type === 'LoserPays' ? 'Kalah Bayar' : 'Host Bayar';
      message += `💰 Sistem: ${feeLabel}\n\n`

      // Jika ada deskripsi/catatan khusus, mention juga biar sopan
      if (match.description) {
         message += `Saya juga sudah membaca catatan: _"${match.description}"_\n\n`
      }

      message += `Apakah slot ini masih open? Kami berminat sparring. Terima kasih.`
      
      // 4. Buka WhatsApp
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
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

  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        setLoading(true)
        
        // 1. AMBIL USER LOGIN (TAMBAHKAN INI)
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user) // Simpan user ke state agar variabel 'currentUser' tidak error

        // 2. Ambil Data Match
        const { data, error } = await supabase
          .from('matches')
          .select('*, teams(*)') // Join ke tabel teams
          .eq('id', id)
          .single()

        if (error) throw error
        setMatch(data)

        // 3. Ambil Nomor WA Manager
        if (data.teams?.manager_id) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('whatsapp_number')
                .eq('id', data.teams.manager_id)
                .single()
            setManagerPhone(profile?.whatsapp_number)
        }

      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchMatchData()
  }, [id])

  
  const handleReport = () => {
      const adminPhone = process.env.NEXT_PUBLIC_ADMIN_WA || '6281234567890' 
      const reason = `Halo Admin, saya ingin melaporkan postingan mencurigakan ini: \n\nLink: ${window.location.href} \n\nMohon dicek.`
      window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(reason)}`, '_blank')
  }

  if (match && match.is_deleted) {
      return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-24 px-4">
            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl border-2 border-red-100 overflow-hidden">
                
                {/* Header Merah */}
                <div className="bg-red-50 p-6 text-center border-b border-red-100">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Postingan Dihapus</h1>
                    <p className="text-gray-600 text-sm">
                        Pemilik telah menghapus postingan ini. Informasi detail pertandingan tidak lagi tersedia untuk publik.
                    </p>
                </div>

                {/* AREA LAPOR (TETAP MUNCUL!) */}
                <div className="p-6 bg-white">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                        <h3 className="font-bold text-yellow-800 text-sm mb-1">Merasa Ditipu?</h3>
                        <p className="text-xs text-yellow-700">
                            Jika Anda diarahkan ke sini setelah bertransaksi atau merasa ada indikasi penipuan, Anda tetap bisa melaporkan akun ini kepada Admin.
                        </p>
                    </div>

                    {/* Tombol Lapor */}
                    <button
                        onClick={() => {
                            const adminPhone = process.env.NEXT_PUBLIC_ADMIN_WA || '6281234567890'
                            // Kita kirim ID Match nya juga supaya Admin bisa cek di database
                            const reason = `Halo Admin, Lapor PENIPUAN. \nUser ini menghapus postingan setelah transaksi.\n\nMatch ID: ${match.id} \nNama Tim: ${match.teams?.name} \n\nMohon tindak lanjut.`
                            window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(reason)}`, '_blank')
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow transition flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        Laporkan Pemilik Postingan
                    </button>
                    
                    <div className="mt-4 text-center">
                         <Link href="/" className="text-gray-400 text-sm hover:text-gray-600">Kembali ke Beranda</Link>
                    </div>
                </div>
            </div>
        </div>
      )
  }

// --- 1. MODERN LOADING SKELETON (Meniru bentuk halaman asli) ---
  if (loading) return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:p-10 flex justify-center items-start animate-pulse, pt-24">
      <div className="bg-white max-w-2xl w-full rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Skeleton Header */}
        <div className="bg-gray-200 h-32 w-full p-6 flex justify-between items-center">
            <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-8 bg-gray-300 rounded w-48"></div>
            </div>
            <div className="h-10 bg-gray-300 rounded w-20"></div>
        </div>

        {/* Skeleton Content */}
        <div className="p-6 md:p-8 space-y-8">
            {/* Skeleton Team Card */}
            <div className="flex items-center gap-5 p-4 rounded-2xl border border-gray-100">
                <div className="w-16 h-16 bg-gray-200 rounded-full shrink-0"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
            </div>
            
            <div className="border-t border-gray-100"></div>

            {/* Skeleton Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 h-32 rounded-2xl p-5 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="bg-gray-50 h-32 rounded-2xl p-5 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                </div>
            </div>
            
            {/* Skeleton Button */}
            <div className="h-14 bg-gray-200 rounded-xl w-full mt-4"></div>
        </div>
      </div>
    </div>
  )

  

  // --- 2. MODERN NOT FOUND STATE (Tanpa Emoji) ---
  if (!match) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center pt-24">
        {/* Icon Search Kosong (SVG) */}
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        </div>
        
        <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Jadwal Tidak Ditemukan</h1>
        <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg leading-relaxed">
            Sepertinya jadwal pertandingan ini sudah dihapus oleh pemiliknya atau link yang kamu tuju salah.
        </p>

        <Link href="/" className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition transform active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Cari Lawan Lain
        </Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 md:px-10 flex justify-center items-start">
        
      <div className="bg-white max-w-2xl w-full rounded-3xl shadow-xl overflow-hidden border border-gray-100 ring-1 ring-black/5">
        
        {/* --- HEADER: TANGGAL & WAKTU --- */}
        <div className="bg-gray-900 text-white p-6 md:p-8 flex justify-between items-center relative overflow-hidden">
            {/* Background Pattern Hiasan (Opsional) */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 text-gray-800 opacity-20">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"></path></svg>
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    Jadwal Pertandingan
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{match.play_date}</h1>
            </div>
            
            <div className="text-right relative z-10">
                <div className="flex items-center justify-end gap-1 text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span className="text-3xl md:text-4xl font-black tracking-tight">{match.play_time.slice(0,5)}</span>
                </div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">WIB</p>
            </div>
        </div>

        {/* --- BODY CONTENT --- */}
        <div className="p-6 md:p-8 space-y-8">
            
            {/* 1. IDENTITAS TIM (HOST) */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Host Team / Penantang</label>
                <Link href={`/teams/${match.teams.id}`} className="group block">
                    <div className="flex items-center gap-5 p-4 rounded-2xl border border-gray-200 bg-white hover:border-blue-400 hover:shadow-md transition cursor-pointer">
                        {/* Avatar */}
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2 border-white shadow-sm group-hover:scale-105 transition">
                            {match.teams?.logo_url ? (
                                <img src={match.teams.logo_url} className="w-full h-full object-cover"/>
                            ) : (
                                // Fallback Icon Shield (User Group)
                                <svg className="text-gray-400 w-8 h-8 md:w-10 md:h-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            )}
                        </div>
                        
                        {/* Info Teks */}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 truncate group-hover:text-blue-600 transition">
                                {match.teams?.name}
                            </h2>
                            {/* TOMBOL EDIT (Hanya muncul jika milik sendiri) */}
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    {match.teams?.city}
                                </span>
                                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${
                                    match.teams?.skill_level === 'Pro' ? 'bg-purple-100 text-purple-700' : 
                                    match.teams?.skill_level === 'Intermediate' ? 'bg-blue-100 text-blue-700' : 
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                                    {match.teams?.skill_level || 'Fun'}
                                </span>
                            </div>
                        </div>
                        

                        {/* Chevron Arrow */}
                        <div className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition">
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                    </div>
                </Link>
            </div>

            <div className="border-t border-gray-100"></div>

            {/* 2. DETAIL INFO GRID */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                
                {/* Lokasi Card */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            Lokasi
                        </div>
                        <p className="font-bold text-lg text-gray-900 leading-tight">{match.location_name}</p>
                    </div>
                    <div className="mt-4">
                        {match.is_venue_booked ? 
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Booking Aman
                            </span> : 
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-orange-100 px-3 py-1.5 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                Belum Booking
                            </span>
                        }
                    </div>
                </div>
                {/* Biaya Card */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                            Sistem Bayar
                        </div>
                        <p className="font-bold text-lg text-gray-900 leading-tight">{match.fee_type}</p>
                    </div>
                    <p className="text-sm text-gray-500 font-medium mt-4">
                        {match.fee_type === 'Split' ? 'Bayar Patungan (50:50)' : 
                         match.fee_type === 'LoserPays' ? 'Yang Kalah Bayar Lapangan' : 
                         'Tuan Rumah yang Bayar'}
                    </p>
                </div>
            </div>


            <div>
                {/* TAMPILKAN DESKRIPSI JIKA ADA */}
                        {match.description && (
                            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl mt-4">
                                <h3 className="text-xs font-bold text-yellow-700 uppercase mb-1 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                    Catatan Manager
                                </h3>
                                <p className="text-gray-700 text-sm whitespace-pre-line italic">
                                    "{match.description}"
                                </p>
                            </div>
                        )}
            </div>

                        {/* --- AREA PRIVASI: BUKTI BOOKING (HANYA DILIHAT PEMILIK) --- */}
            {currentUser && currentUser.id === match.user_id && match.is_venue_booked && match.booking_proof_url && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="bg-yellow-100 text-yellow-700 p-2 rounded-lg">
                            {/* Icon Lock / Gembok */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-sm mb-1">Bukti Booking Lapangan</h3>
                            <p className="text-xs text-gray-600 mb-3">
                                Foto ini bersifat <strong>RAHASIA</strong> dan hanya terlihat oleh Anda (Manager), tidak oleh user lain.
                            </p>
                            
                            {/* Preview Gambar Kecil */}
                            <div 
                                className="relative w-full h-40 bg-gray-200 rounded-lg overflow-hidden cursor-zoom-in border border-yellow-300 shadow-sm group"
                                onClick={() => setPreviewImage(match.booking_proof_url)} // Pastikan state previewImage ada
                            >
                                <img 
                                    src={match.booking_proof_url} 
                                    alt="Bukti Booking" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">Klik untuk memperbesar</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* 3. TOMBOL AKSI */}
            <div className="pt-4 space-y-3">
                
                {/* --- LOGIC PROTEKSI KONTAK --- */}
                {currentUser ? (
                    // KONDISI 1: USER SUDAH LOGIN (Boleh Klik)
                    <button 
                        onClick={handleContactWA}
                        className="group w-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-lg font-bold py-4 px-6 rounded-xl shadow-lg shadow-green-200 transition-all transform active:scale-95 flex items-center justify-center gap-3"
                    >
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.355-5.294 9.881 9.881 0 019.884-9.881 9.881 9.881 0 019.88 9.88 9.88 9.88 0 01-9.88 9.88M12 2C6.48 2 2 6.48 2 12c0 1.84.48 3.58 1.32 5.12L2.12 21.88l4.88-1.21C8.42 21.52 10.16 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>
                        Hubungi Lawan
                    </button>
                ) : (
                    // KONDISI 2: USER BELUM LOGIN (Tombol Terkunci)
                    <Link href="/login" className="block">
                        <button 
                            className="w-full bg-gray-100 text-gray-400 text-lg font-bold py-4 px-6 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center gap-3 cursor-pointer hover:bg-gray-200 hover:text-gray-600 transition"
                        >
                            {/* Icon Gembok */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            Login untuk Hubungi
                        </button>
                    </Link>
                )}
                
                {/* Tombol Share (Secondary) - Biarkan tetap bisa diklik siapa saja */}
                <button 
                    onClick={handleShare}
                    className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-lg font-bold py-3.5 px-6 rounded-xl transition flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                    Bagikan
                </button>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-6">
                    {/* Link Kembali */}
                    <Link href="/" className="flex items-center gap-2 text-gray-400 font-bold hover:text-gray-900 transition text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        Cari lawan lain
                    </Link>

                    {/* Tombol Laporkan (Security Layer) */}
                    <button 
                        onClick={handleReport}
                        className="text-xs font-bold text-red-400 hover:text-red-600 hover:underline flex items-center gap-1 transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        Lapor
                    </button>
                </div>

            </div>

        </div>
      </div>
    
    {/* --- MODAL NOTIFIKASI (MODERN UI) --- */}
            {notification && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in">
                
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 flex flex-col items-center text-center">
                    
                    {/* ICON ERROR (Silang Merah) */}
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-5">
                        <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </div>
                    </div>

                    {/* TEKS PESAN */}
                    <h3 className="text-xl font-black text-red-600 mb-2">
                        {notification.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-8">
                        {notification.message}
                    </p>

                    {/* TOMBOL TUTUP */}
                    <button 
                        onClick={() => setNotification(null)}
                        className="w-full py-3.5 rounded-xl font-bold text-white transition shadow-lg transform active:scale-95 bg-red-600 hover:bg-red-700 shadow-red-200"
                    >
                        Oke, Mengerti
                    </button>

                </div>
                </div>
            )}

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

    </div>
  )
}