// src/app/dashboard/page.jsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CITIES } from '../../lib/cities' 

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  
  const [profile, setProfile] = useState({ full_name: '', whatsapp_number: '' })
  const [team, setTeam] = useState(null)
  const [myMatches, setMyMatches] = useState([])
  
  const [isEditing, setIsEditing] = useState(false)
  const [uploading, setUploading] = useState(false) 
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [previewImage, setPreviewImage] = useState(null) 

  const [activeTab, setActiveTab] = useState('active') // Default ke 'active'  

  const [notification, setNotification] = useState(null)
  

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      if (profileData) setProfile(profileData)

      // Ambil semua kolom termasuk homebase
      const { data: teamData } = await supabase
        .from('teams').select('*').eq('manager_id', user.id).single()
      
      if (teamData) {
        setTeam(teamData)
        const { data: matchesData } = await supabase
          .from('matches')
          .select('*')
          .eq('team_id', teamData.id)
          .order('status', { ascending: false })
          .order('play_date', { ascending: true })
        
        setMyMatches(matchesData || [])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (event) => {
    // --- CEK ID DULU ---
    if (!team?.id) {
        setNotification({
            type: 'error',
            title: 'Simpan Data Dulu',
            message: 'Mohon isi Nama Tim dan klik tombol "Simpan Perubahan" di bawah, baru upload logo.'
        })
        return
    }

    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) throw new Error('Pilih gambar dulu!')
      
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `logo_${team.id}_${Math.random()}.${fileExt}`
      const filePath = `${team.id}/${fileName}`
      
      // ... (sisa kodingan upload sama seperti sebelumnya) ...
      let { error: uploadError } = await supabase.storage.from('team-logos').upload(filePath, file)
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage.from('team-logos').getPublicUrl(filePath)
      
      const { error: dbError } = await supabase.from('teams').update({ logo_url: publicUrl }).eq('id', team.id)
      if (dbError) throw dbError
      
      setTeam({ ...team, logo_url: publicUrl })
      
      setNotification({ type: 'success', title: 'Berhasil!', message: 'Logo tim berhasil diganti.' })
    } catch (error) { 
        setNotification({ type: 'error', title: 'Gagal Upload', message: error.message })
    } finally { setUploading(false) }
  }

  // FUNGSI UPLOAD BANNER (SAMPUL)
  const handleBannerUpload = async (event) => {
    // 1. CEK ID DULU (PENTING!)
    // Jika user baru ketik nama tapi belum klik "Simpan", id masih kosong.
    if (!team?.id) {
        setNotification({
            type: 'error',
            title: 'Simpan Data Dulu',
            message: 'Mohon simpan Nama Tim & Kota terlebih dahulu (klik tombol Simpan di bawah) sebelum mengganti sampul.'
        })
        return
    }

    try {
      setUploadingBanner(true) // Mulai loading khusus banner
      
      // 2. Cek File
      if (!event.target.files || event.target.files.length === 0) {
          throw new Error('Pilih gambar dulu!')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      // Nama file unik: banner_IDTIM_AngkaAcak.jpg
      const fileName = `banner_${team.id}_${Math.random()}.${fileExt}`
      const filePath = `${team.id}/${fileName}`

      // 3. Upload ke Supabase Storage
      // Pastikan bucket 'team-logos' sudah Anda buat public di Supabase
      let { error: uploadError } = await supabase.storage
          .from('team-logos') 
          .upload(filePath, file)
      
      if (uploadError) throw uploadError

      // 4. Ambil URL Gambar
      const { data: { publicUrl } } = supabase.storage
          .from('team-logos')
          .getPublicUrl(filePath)

      // 5. Update Database (Hanya kolom banner_url)
      const { error: dbError } = await supabase
          .from('teams')
          .update({ banner_url: publicUrl })
          .eq('id', team.id)

      if (dbError) throw dbError

      // 6. Update Tampilan di Layar (State)
      setTeam({ ...team, banner_url: publicUrl })

      // 7. Notifikasi Sukses
      setNotification({
          type: 'success',
          title: 'Sampul Baru! ✨',
          message: 'Gambar sampul tim berhasil diperbarui.'
      })
      
      // Kita TIDAK perlu setIsEditing(false) disini, 
      // supaya user bisa lanjut edit teks jika mau.

    } catch (error) {
      // Notifikasi Gagal
      setNotification({
          type: 'error',
          title: 'Gagal Upload',
          message: error.message
      })
    } finally {
      setUploadingBanner(false) // Stop loading
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // 1. Update Profil User (Manager)
      await supabase.from('profiles').update({
        full_name: profile.full_name,
        whatsapp_number: profile.whatsapp_number
      }).eq('id', user.id)
      
      // 2. Cek Logika Tim (Update atau Buat Baru)
      if (team?.id) {
        // --- KONDISI A: TIM SUDAH ADA -> UPDATE ---
        const { error } = await supabase.from('teams').update({
          name: team.name,
          city: team.city,
          skill_level: team.skill_level,
          homebase: team.homebase
        }).eq('id', team.id)
        if (error) throw error

      } else {
        // --- KONDISI B: TIM BELUM ADA -> BUAT BARU (INSERT) ---
        // Kita butuh nama tim minimal. Kalau kosong kasih default.
        const newTeamPayload = {
            manager_id: user.id,
            name: team?.name || 'Tim Tanpa Nama',
            city: team?.city || CITIES[0],
            skill_level: team?.skill_level || 'Fun',
            homebase: team?.homebase || ''
        }

        const { data: newTeam, error } = await supabase
            .from('teams')
            .insert([newTeamPayload])
            .select()
            .single()
        
        if (error) throw error
        
        // PENTING: Update state 'team' dengan data baru dari DB (yang sudah punya ID)
        setTeam(newTeam)
      }

      setNotification({
        type: 'success',
        title: 'Profil Disimpan! ✅',
        message: 'Data tim dan profil berhasil diperbarui.'
      })
      setIsEditing(false)

    } catch (error) { 
        setNotification({ type: 'error', title: 'Gagal Simpan', message: error.message }) 
    } finally { 
        setLoading(false) 
    }
  }

  const handleMarkAsDone = async (matchId) => {
    const isConfirmed = window.confirm("Yakin sudah dapat lawan? Postingan ini akan dihapus dari halaman depan.")
    if (!isConfirmed) return
    try {
      await supabase.from('matches').update({ status: 'Closed' }).eq('id', matchId)
      fetchDashboardData()
      setNotification({
        type: 'success',
        title: 'Berhasil!',
        message: 'Jadwal tanding telah ditandai selesai.'
      })
    } catch (error) { 
        setNotification({
            type: 'error',
            title: 'Ups, Gagal Update!',
            message: error.message
        })
    }
  }

  const handleDelete = async (matchId) => {
    // Konfirmasi standar browser dulu (atau mau buat modal konfirmasi terpisah juga bisa)
    if (!confirm("Yakin ingin menghapus jadwal ini selamanya?")) return

    try {
        // 1. Eksekusi Delete dan TANGKAP kembalian 'error'
        const { error } = await supabase
            .from('matches')
            .delete()
            .eq('id', matchId)

        // 2. JIKA ADA ERROR DARI SUPABASE, LEMPAR KE CATCH
        if (error) throw error

        // 3. Jika Sukses, Update UI
        // Kita update state lokal saja biar cepat (tanpa fetch ulang)
        setMyMatches((prev) => prev.filter((m) => m.id !== matchId))

        // Tampilkan Notifikasi Sukses
        setNotification({
            type: 'success',
            title: 'Terhapus! 🗑️',
            message: 'Jadwal pertandingan berhasil dihapus dari sistem.'
        })

    } catch (error) {
        // Tangkap error di sini
        setNotification({
            type: 'error',
            title: 'Gagal Hapus',
            message: error.message || 'Terjadi kesalahan saat menghapus.'
        })
    }
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  // --- MODERN DASHBOARD SKELETON ---
  if (loading) return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 md:px-8 animate-pulse">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* 1. SKELETON PROFIL TIM (HEADER) */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Logo Circle */}
            <div className="w-24 h-24 bg-gray-200 rounded-full shrink-0"></div>
            
            <div className="flex-1 w-full space-y-4 text-center md:text-left">
                {/* Nama Tim */}
                <div className="h-8 bg-gray-200 rounded-lg w-3/4 md:w-1/3 mx-auto md:mx-0"></div>
                
                {/* Badges (Kota & Level) */}
                <div className="flex justify-center md:justify-start gap-2">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                </div>
            </div>

            {/* Tombol Edit */}
            <div className="h-10 bg-gray-200 rounded-lg w-24 shrink-0"></div>
        </div>

        {/* 2. SKELETON MANAGER INFO */}
        <div className="grid md:grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded-xl"></div>
            <div className="h-20 bg-gray-200 rounded-xl"></div>
        </div>

        {/* 3. SKELETON LIST POSTINGAN */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-6">
            {/* Header Section */}
            <div className="flex justify-between items-center">
                <div className="h-6 bg-gray-200 rounded w-40"></div>
                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            </div>

            {/* List Items */}
            {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-100 p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-1">
                        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-10 bg-gray-200 rounded-lg w-24"></div>
                        <div className="h-10 bg-gray-200 rounded-lg w-20"></div>
                    </div>
                </div>
            ))}
        </div>

      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 md:px-8">
      
      {/* POPUP LIGHTBOX */}
      {previewImage && (
        <div 
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
        >
            <img src={previewImage} alt="Full Preview" className="max-w-full max-h-screen object-contain rounded-lg shadow-2xl"/>
            <button className="absolute top-6 right-6 text-white/50 hover:text-white text-5xl font-bold">&times;</button>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        
        {/* Header Dashboard dengan Icon SVG */}
        <div className="flex justify-between items-end mb-8">
          <div className="flex items-center gap-3">
            {/* ICON DASHBOARD (SVG) */}
            <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
               </svg>
            </div>
            <div>
               <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard Saya</h1>
               <p className="text-sm text-gray-500 hidden md:block">Kelola tim dan jadwal tandingmu di sini.</p>
            </div>
          </div>
          
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 font-bold text-sm hover:bg-red-50 px-3 py-2 rounded-lg transition">
            {/* Icon Logout Kecil */}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Logout
          </button>
        </div>

        {/* --- IDENTITAS TIM --- */}
        <div className="bg-white rounded-xl shadow-sm mb-6 border border-gray-200 overflow-hidden">
          
          {/* BANNER AREA */}
          <div className="h-40 relative bg-gray-200 group">
            {team?.banner_url ? (
                <img 
                    src={team.banner_url} 
                    alt="Sampul Tim" 
                    className={`w-full h-full object-cover transition ${!isEditing ? 'cursor-pointer hover:opacity-90' : ''}`}
                    onClick={() => !isEditing && setPreviewImage(team.banner_url)}
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                    <span className="text-white/20 font-bold text-4xl uppercase tracking-widest select-none">
                        {team?.name || 'TIM'}
                    </span>
                </div>
            )}
            
            <div className={`absolute inset-0 bg-black/30 transition-opacity ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 pointer-events-none'}`}></div>

            {isEditing && (
                <label className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer bg-white/90 hover:bg-white text-gray-800 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg transition flex items-center gap-2 hover:scale-105 active:scale-95">
                    
                    {/* Logika Icon: Kalau loading putar spinner, kalau tidak munculkan kamera */}
                    {uploadingBanner ? (
                        // Icon Loading (Spinner Berputar)
                        <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        // Icon Kamera (Camera SVG)
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                        </svg>
                    )}

                    <span>{uploadingBanner ? 'Mengupload...' : 'Ganti Sampul'}</span>
                    
                    <input type="file" accept="image/*" onChange={handleBannerUpload} disabled={uploadingBanner} className="hidden" />
                </label>
            )}

            {!isEditing && (
                <button 
                    onClick={() => setIsEditing(true)} 
                    className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm transition border border-white/30 flex items-center gap-2 z-10"
                >
                    {/* Icon Pensil Minimalis (SVG) */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit Profil
                </button>
            )}
          </div>

          {/* --- KONTEN PROFIL --- */}
          {isEditing ? (
            // MODE EDIT
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Edit Data Tim</h2>
                    <button onClick={() => setIsEditing(false)} className="text-gray-500 text-sm font-bold hover:text-red-500">✕ Selesai</button>
                </div>

                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                         {team?.logo_url ? <img src={team.logo_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-2xl">⚽</span>}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 mb-2">Logo Tim (Avatar)</p>
                        
                        {/* Tombol Upload dengan Style "Clean/Soft" */}
                        <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 text-xs font-bold py-2 px-4 rounded-lg inline-flex items-center gap-2 transition shadow-sm hover:shadow active:scale-95">
                            
                            {uploading ? (
                                // 1. Icon Loading (Spinner Abu-abu)
                                <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                // 2. Icon Upload (Panah ke Atas)
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                            )}

                            <span>{uploading ? 'Proses...' : 'Upload Logo'}</span>
                            
                            <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} className="hidden" />
                        </label>
                    </div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* NAMA TIM */}
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Nama Tim</label>
                            <input type="text" className="w-full border p-2 rounded text-gray-900 bg-white" value={team?.name || ''} onChange={(e) => setTeam({...team, name: e.target.value})}/>
                        </div>
                        
                        {/* INPUT BARU: HOMEBASE */}
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Markas / Lapangan Favorit</label>
                            <input 
                                type="text" 
                                className="w-full border p-2 rounded text-gray-900 bg-white" 
                                placeholder="Cth: Garing Futsal"
                                value={team?.homebase || ''} 
                                onChange={(e) => setTeam({...team, homebase: e.target.value})}
                            />
                        </div>

                        {/* KOTA (FILTER) */}
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Kota Homebase (Filter)</label>
                            <select className="w-full border p-2 rounded bg-white text-gray-900" value={team?.city || ''} onChange={(e) => setTeam({...team, city: e.target.value})}>
                                <option value="" disabled>-- Pilih Kota --</option>
                                {CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
                            </select>
                        </div>

                        <div>
                            {/* Label dengan Icon Petir Kecil */}
                            <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                                </svg>
                                Level Permainan
                            </label>
                            
                            <div className="relative">
                                <select 
                                    className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition cursor-pointer" 
                                    value={team?.skill_level || 'Fun'} 
                                    onChange={(e) => setTeam({...team, skill_level: e.target.value})}
                                >
                                    <option value="Fun">Fun / Hura-hura</option>
                                    <option value="Intermediate">Menengah / Sparring Rutin</option>
                                    <option value="Pro">Pro / Kompetitif</option>
                                </select>
                                
                                {/* Custom Icon Panah Bawah (Supaya tidak kaku) */}
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Nama Manager</label>
                            <input type="text" className="w-full border p-2 rounded text-gray-900 bg-white" value={profile.full_name || ''} onChange={(e) => setProfile({...profile, full_name: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1 text-red-600 font-bold">No WhatsApp (Wajib)</label>
                            <input type="text" className="w-full border p-2 rounded bg-red-50 border-red-200 text-gray-900" value={profile.whatsapp_number || ''} onChange={(e) => setProfile({...profile, whatsapp_number: e.target.value})}/>
                        </div>
                    </div>
                    <button className="bg-black text-white px-6 py-2 rounded-lg font-bold w-full mt-2 hover:bg-gray-800">Simpan Perubahan</button>
                </form>
            </div>
          ) : (
            // MODE VIEW
            <div className="px-6 pb-6 relative">
                <div className="-mt-12 mb-4 relative inline-block">
                    <div 
                        className={`w-24 h-24 bg-white rounded-full p-1 shadow-lg ${team?.logo_url ? 'cursor-pointer hover:scale-105 transition' : ''}`}
                        onClick={() => team?.logo_url && setPreviewImage(team.logo_url)}
                    >
                        <div className="w-full h-full bg-gray-100 rounded-full overflow-hidden flex items-center justify-center text-4xl border border-gray-100">
                            {team?.logo_url ? <img src={team.logo_url} className="w-full h-full object-cover" /> : <span>⚽</span>}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">{team?.name || "Nama Tim"}</h3>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                            
                            {/* 1. KOTA (Icon Map Pin) */}
                            <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg text-gray-600 text-xs font-bold uppercase tracking-wide">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                {team?.city || "Kota"}
                            </span>
                            
                            {/* 2. HOMEBASE (Icon Rumah) */}
                            {team?.homebase && (
                                <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg text-gray-600 text-xs font-bold uppercase tracking-wide">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                    </svg>
                                    {team.homebase}
                                </span>
                            )}

                            {/* 3. SKILL LEVEL (Icon Petir) */}
                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide ${
                                team?.skill_level === 'Pro' ? 'bg-purple-100 text-purple-700' : 
                                team?.skill_level === 'Intermediate' ? 'bg-blue-100 text-blue-700' : 
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                                </svg>
                                {team?.skill_level || "Fun"}
                            </span>
                            
                        </div>
                    </div>

                    <div className="bg-white pl-3 pr-5 py-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 min-w-[200px]">
                        
                        {/* 1. Avatar Placeholder (Ganti Emoji dengan Icon User) */}
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 border border-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>

                        {/* 2. Info Text */}
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Manager</p>
                            <p className="text-sm font-bold text-gray-900 leading-tight">{profile.full_name || "Nama Manager"}</p>
                            
                            {/* Nomor WA dengan Icon Kecil */}
                            <div className="flex items-center gap-1 mt-1 text-green-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                                <p className="text-xs font-mono font-bold">{profile.whatsapp_number || "-"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          )}
        </div>

        {/* --- MANAJEMEN POSTINGAN (DENGAN TAB RIWAYAT) --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          
          {/* HEADER & TAB SWITCHER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
             
             {/* Judul */}
             <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path>
                </svg>
                <h2 className="text-xl font-bold text-gray-800">Manajemen Postingan</h2>
             </div>

             {/* TOMBOL TAB (SWITCHER) */}
             <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('active')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-2 ${
                        activeTab === 'active' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <span className={`w-2 h-2 rounded-full ${activeTab === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                    Jadwal Aktif
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-2 ${
                        activeTab === 'history' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Riwayat ({myMatches.filter(m => m.status === 'Closed').length})
                </button>
             </div>
          </div>
          
          {/* LOGIKA PEMISAHAN DATA */}
          {(() => {
            // Filter data berdasarkan Tab yang dipilih
            const displayedMatches = activeTab === 'active' 
                ? myMatches.filter(m => m.status === 'Open')
                : myMatches.filter(m => m.status === 'Closed');

            if (displayedMatches.length === 0) {
                // --- TAMPILAN KOSONG (EMPTY STATE) ---
                return (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm text-gray-300">
                            {activeTab === 'active' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            )}
                        </div>
                        <h3 className="text-gray-900 font-bold mb-1">
                            {activeTab === 'active' ? 'Tidak ada jadwal aktif' : 'Belum ada riwayat pertandingan'}
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">
                            {activeTab === 'active' ? 'Buat jadwal sekarang untuk mencari lawan.' : 'Selesaikan pertandingan untuk melihat riwayat.'}
                        </p>
                        
                        {/* Tombol Buat Baru (Hanya muncul di Tab Aktif) */}
                        {activeTab === 'active' && (
                            <Link href="/matches/create" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2">
                                + Buat Jadwal Baru
                            </Link>
                        )}
                    </div>
                )
            }

            // --- TAMPILAN LIST (SAMA SEPERTI SEBELUMNYA) ---
            return (
                <div className="grid gap-4">
                  {displayedMatches.map((m) => (
                    <div key={m.id} className={`group relative border p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition hover:shadow-md ${m.status === 'Closed' ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-gray-200'}`}>
                      
                      {/* Info Kiri */}
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2 text-gray-900">
                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                             <span className="font-bold text-lg">{m.play_date}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded text-sm font-medium text-gray-600">
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                             {m.play_time.slice(0,5)} WIB
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            {m.location_name}
                        </p>
                        <div>
                          {m.status === 'Open' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                              Open / Tayang
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-600 border border-gray-300">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              Selesai / Dapat Lawan
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tombol Aksi */}
                      <div className="flex flex-row items-center gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                        
                        {/* JIKA STATUS OPEN: Tampilkan Tombol Dapat Lawan & Edit */}
                        {m.status === 'Open' ? (
                            <>
                                <button onClick={() => handleMarkAsDone(m.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition shadow-sm hover:shadow flex items-center justify-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    <span className="whitespace-nowrap">Dapat Lawan</span>
                                </button>
                                
                                <div className="flex items-center gap-2">
                                    <Link href={`/matches/${m.id}/edit`} className="w-10 h-10 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 rounded-xl transition" title="Edit">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </Link>
                                    <button onClick={() => handleDelete(m.id)} className="w-10 h-10 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl transition" title="Hapus">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                            </>
                        ) : (
                            // JIKA STATUS CLOSED: Hanya Tampilkan Hapus Riwayat
                            <button onClick={() => handleDelete(m.id)} className="flex-1 border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                Hapus Riwayat
                            </button>
                        )}

                      </div>

                    </div>
                  ))}
                </div>
            )
          })()}
        </div>

      </div>

      {/* --- MODAL NOTIFIKASI (SUCCESS / ERROR) --- */}
      {notification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in">
           
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 flex flex-col items-center text-center">
              
              {/* ICON DINAMIS (Hijau jika Sukses, Merah jika Error) */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${notification.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                 {notification.type === 'success' ? (
                    // ICON SUKSES (Checklist)
                    <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                 ) : (
                    // ICON ERROR (Silang)
                    <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </div>
                 )}
              </div>

              {/* TEKS PESAN */}
              <h3 className={`text-xl font-black mb-2 ${notification.type === 'success' ? 'text-gray-900' : 'text-red-600'}`}>
                 {notification.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                 {notification.message}
              </p>

              {/* TOMBOL TUTUP */}
              <button 
                 onClick={() => setNotification(null)}
                 className={`w-full py-3.5 rounded-xl font-bold text-white transition shadow-lg transform active:scale-95 ${
                    notification.type === 'success' 
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
                    : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                 }`}
              >
                 Oke, Mengerti
              </button>

           </div>
        </div>
      )}

    </div>
  )
}