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
          .order('play_date', { ascending: false })
        
        setMyMatches(matchesData || [])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (event) => {
    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) throw new Error('Pilih gambar dulu!')
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `logo_${team.id}_${Math.random()}.${fileExt}`
      const filePath = `${team.id}/${fileName}`
      let { error: uploadError } = await supabase.storage.from('team-logos').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('team-logos').getPublicUrl(filePath)
      const { error: dbError } = await supabase.from('teams').update({ logo_url: publicUrl }).eq('id', team.id)
      if (dbError) throw dbError
      setTeam({ ...team, logo_url: publicUrl })
      alert('Logo berhasil diganti!')
    } catch (error) { alert('Gagal upload logo: ' + error.message) } finally { setUploading(false) }
  }

  const handleBannerUpload = async (event) => {
    try {
      setUploadingBanner(true)
      if (!event.target.files || event.target.files.length === 0) throw new Error('Pilih gambar dulu!')
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `banner_${team.id}_${Math.random()}.${fileExt}`
      const filePath = `${team.id}/${fileName}`
      let { error: uploadError } = await supabase.storage.from('team-logos').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('team-logos').getPublicUrl(filePath)
      const { error: dbError } = await supabase.from('teams').update({ banner_url: publicUrl }).eq('id', team.id)
      if (dbError) throw dbError
      setTeam({ ...team, banner_url: publicUrl })
      alert('Sampul tim berhasil diganti!')
    } catch (error) { alert('Gagal upload banner: ' + error.message) } finally { setUploadingBanner(false) }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await supabase.from('profiles').update({
        full_name: profile.full_name,
        whatsapp_number: profile.whatsapp_number
      }).eq('id', user.id)
      
      if (team) {
        await supabase.from('teams').update({
          name: team.name,
          city: team.city,
          skill_level: team.skill_level,
          homebase: team.homebase // <--- SIMPAN KOLOM HOMEBASE
        }).eq('id', team.id)
      }
      alert('Profil berhasil diupdate!')
      setIsEditing(false)
    } catch (error) { alert('Gagal update: ' + error.message) } finally { setLoading(false) }
  }

  const handleMarkAsDone = async (matchId) => {
    const isConfirmed = window.confirm("Yakin sudah dapat lawan? Postingan ini akan dihapus dari halaman depan.")
    if (!isConfirmed) return
    try {
      await supabase.from('matches').update({ status: 'Closed' }).eq('id', matchId)
      fetchDashboardData()
      alert("Status berhasil diupdate!")
    } catch (error) { alert('Gagal update: ' + error.message) }
  }

  const handleDelete = async (matchId) => {
    if (!confirm("Hapus jadwal ini selamanya?")) return
    try { await supabase.from('matches').delete().eq('id', matchId); fetchDashboardData() } 
    catch (error) { alert(error.message) }
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  if (loading) return <div className="p-10 text-center">Memuat Dashboard...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      
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
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard Saya ⚙️</h1>
          <button onClick={handleLogout} className="text-red-600 font-medium text-sm hover:underline">Logout</button>
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
                <label className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-bold shadow-lg transition flex items-center gap-2">
                    {uploadingBanner ? 'Mengupload...' : '📷 Ganti Foto Sampul'}
                    <input type="file" accept="image/*" onChange={handleBannerUpload} disabled={uploadingBanner} className="hidden" />
                </label>
            )}

            {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm transition border border-white/30 flex items-center gap-2 z-10">
                    ✏️ Edit Profil
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
                        <p className="text-sm font-bold text-gray-900 mb-1">Logo Tim (Avatar)</p>
                        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg inline-block transition">
                            {uploading ? '...' : 'Upload Logo Kecil'}
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
                            <label className="block text-xs text-gray-500 mb-1">Level Permainan</label>
                            <select className="w-full border p-2 rounded bg-white text-gray-900" value={team?.skill_level || 'Fun'} onChange={(e) => setTeam({...team, skill_level: e.target.value})}>
                                <option value="Fun">Fun / Hura-hura 🥳</option>
                                <option value="Intermediate">Menengah / Sparring Rutin ⚽</option>
                                <option value="Pro">Pro / Kompetitif 🏆</option>
                            </select>
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
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-2 font-medium">
                            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-gray-600">📍 {team?.city || "Kota"}</span>
                            
                            {/* TAMPILKAN HOMEBASE DI SINI */}
                            {team?.homebase && (
                                <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-gray-600">
                                    🏠 {team.homebase}
                                </span>
                            )}

                            <span className={`flex items-center gap-1 px-2 py-1 rounded ${
                                team?.skill_level === 'Pro' ? 'bg-purple-100 text-purple-700' : 
                                team?.skill_level === 'Intermediate' ? 'bg-blue-100 text-blue-700' : 
                                'bg-yellow-100 text-yellow-700'
                            }`}>⚡ {team?.skill_level || "Fun"}</span>
                        </div>
                    </div>

                    <div className="bg-gray-50 pl-3 pr-5 py-2 rounded-lg border border-gray-200 flex items-center gap-3 min-w-[200px]">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl shadow-sm">📞</div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Manager</p>
                            <p className="text-sm font-bold text-gray-900 leading-tight">{profile.full_name}</p>
                            <p className="text-xs text-green-600 font-mono font-medium mt-0.5">{profile.whatsapp_number || "-"}</p>
                        </div>
                    </div>
                </div>
            </div>
          )}
        </div>

        {/* --- MANAJEMEN POSTINGAN --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-gray-800">Manajemen Postingan</h2>
          </div>
          
          {myMatches.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              Belum ada jadwal. <Link href="/matches/create" className="text-blue-600 underline">Buat sekarang</Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {myMatches.map((m) => (
                <div key={m.id} className={`border p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition ${m.status === 'Closed' ? 'bg-gray-50 opacity-75' : 'bg-white'}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg text-gray-900">{m.play_date}</span>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-bold">{m.play_time.slice(0,5)} WIB</span>
                    </div>
                    <p className="text-sm text-gray-600">📍 {m.location_name}</p>
                    <div className="mt-2">
                      {m.status === 'Open' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">🟢 Open (Tayang)</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-600">🔒 Closed (Selesai)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    {m.status === 'Open' && (
                      <button onClick={() => handleMarkAsDone(m.id)} className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm">✅ Dapat Lawan</button>
                    )}
                    <button onClick={() => handleDelete(m.id)} className="flex-1 md:flex-none border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-bold transition">Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}