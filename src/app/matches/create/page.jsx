// src/app/matches/create/page.jsx
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateMatch() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  const [showLimitModal, setShowLimitModal] = useState(false) 
  const [currentCount, setCurrentCount] = useState(0)
  
  // State Data Tim
  const [myTeam, setMyTeam] = useState(null)

  const [notification, setNotification] = useState(null)

  // State Form Standar
  const [formData, setFormData] = useState({
    play_date: '',
    play_time: '',
    location_name: '',
    fee_type: 'Split',
    description: '',
    new_team_name: '',
    new_team_city: ''
  })

  // --- STATE BARU: BOOKING & UPLOAD ---
  const [isVenueBooked, setIsVenueBooked] = useState(false) // Default: Belum Booking
  const [proofFile, setProofFile] = useState(null)          // File Gambar
  
  // 1. Cek Login & Cek Tim Existing
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      
      setUser(user)

      // Cek apakah user ini manager dari sebuah tim?
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('manager_id', user.id)
        .single()

      if (teamData) {
        setMyTeam(teamData)
      }
      
      setLoading(false)
    }
    checkSession()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Pastikan user ada (Security check di frontend)
      if (!user) throw new Error("Anda harus login dulu!");

      // 1. SKENARIO A: BUAT TIM BARU (Jika belum punya)
      let teamIdToUse = myTeam?.id

      if (!myTeam) {
        const { data: newTeam, error: teamError } = await supabase
          .from('teams')
          .insert([{ 
              name: formData.new_team_name, 
              city: formData.new_team_city, 
              manager_id: user.id 
          }])
          .select()
          .single()

        if (teamError) throw teamError
        teamIdToUse = newTeam.id
      }

      // --- CEK BATASAN POSTINGAN ---
      const { data: existingMatches, error: countError } = await supabase
        .from('matches')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'Open')

      if (countError) throw countError

      // BATASAN: Maksimal 7 jadwal aktif
      const MAX_OPEN_MATCHES = 7 

      if (existingMatches.length >= MAX_OPEN_MATCHES) {
        setCurrentCount(existingMatches.length) // Simpan jumlah utk ditampilkan
        setShowLimitModal(true) // Munculkan Pop-up Keren
        setLoading(false)
        return 
      }

      // 2. SKENARIO B: UPLOAD BUKTI (Jika status 'Sudah Booking' & ada file)
      let finalProofUrl = null

      if (isVenueBooked && proofFile) {
        const fileExt = proofFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${fileName}`

        // Upload ke Bucket 'match-proofs'
        const { error: uploadError } = await supabase.storage
            .from('match-proofs')
            .upload(filePath, proofFile)

        if (uploadError) throw uploadError

        // Ambil URL Publik
        const { data: urlData } = supabase.storage
            .from('match-proofs')
            .getPublicUrl(filePath)
        
        finalProofUrl = urlData.publicUrl
      }

      // 3. SKENARIO C: SIMPAN JADWAL PERTANDINGAN
      const { error: matchError } = await supabase
        .from('matches')
        .insert([{
          user_id: user.id, // <--- WAJIB ADA! (Agar lolos security policy)
          team_id: teamIdToUse,
          play_date: formData.play_date,
          play_time: formData.play_time,
          location_name: formData.location_name,
          fee_type: formData.fee_type,

          description: formData.description,
          
          // Kolom Baru
          is_venue_booked: isVenueBooked,
          booking_proof_url: finalProofUrl,
          
          status: 'Open'
        }])

      if (matchError) throw matchError

      setNotification({
        type: 'success',
        title: 'Jadwal Terbit! 🔥',
        message: 'Tantangan Anda berhasil diposting. Tunggu lawan menghubungi Anda.'
      })

    } catch (error) {
      setNotification({
        type: 'error',
        title: 'Gagal Posting Tantangan',
        message: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  // Loading Screen Sederhana
  if (loading) return (
    <div className="min-h-screen bg-gray-50 pt-24 flex justify-center">
        <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 w-full max-w-lg bg-gray-200 rounded-xl"></div>
        </div>
    </div>
  )

  

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 flex justify-center">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-lg h-fit">
        
        <h2 className="text-2xl md:text-3xl font-black mb-6 text-gray-900 tracking-tight flex items-center gap-3">
            {/* Icon Flame SVG dengan animasi pulse */}
            <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 md:w-8 md:h-8 animate-pulse">
                    <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                </svg>
            </div>
            Buat Tantangan
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* --- BAGIAN 1: IDENTITAS TIM --- */}
          {myTeam ? (
            // Read Only (Sudah Punya Tim)
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl border border-blue-100 shadow-sm">
                 {myTeam.logo_url ? <img src={myTeam.logo_url} className="w-full h-full object-cover rounded-full"/> : '🛡️'}
               </div>
               <div>
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Posting Sebagai</p>
                  <p className="text-lg font-bold text-gray-900">{myTeam.name}</p>
                  <p className="text-xs text-gray-500">{myTeam.city}</p>
               </div>
            </div>
          ) : (
            // Input Tim Baru
            <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-200">
              <p className="text-sm text-yellow-800 mb-3 font-bold flex items-center gap-2">
                ⚠️ Buat Profil Tim Dulu
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nama Tim</label>
                  <input required type="text" className="w-full p-2.5 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" 
                    placeholder="Contoh: Garuda FC"
                    onChange={(e) => setFormData({...formData, new_team_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Kota Homebase</label>
                  <input required type="text" className="w-full p-2.5 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" 
                    placeholder="Contoh: Jakarta Selatan"
                    onChange={(e) => setFormData({...formData, new_team_city: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {/* --- BAGIAN 2: DETAIL JADWAL --- */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal Main</label>
              <input name="play_date" type="date" required className="w-full p-3 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none" 
                onChange={(e) => setFormData({...formData, play_date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jam Main</label>
              <input name="play_time" type="time" required className="w-full p-3 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={(e) => setFormData({...formData, play_time: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lokasi Lapangan</label>
            <div className="relative">
                <input name="location_name" type="text" required className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nama Futsal / Lokasi"
                  onChange={(e) => setFormData({...formData, location_name: e.target.value})}
                />
                <div className="absolute left-3 top-3.5 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
            </div>
          </div>

          {/* INPUT DESKRIPSI / CATATAN */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Catatan Tambahan (Opsional)</label>
            <textarea 
              className="w-full p-3 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none" 
              placeholder="Contoh: Main santai, no hard tackle. Lawan harap bawa rompi."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* --- BAGIAN 3: STATUS BOOKING (BARU) --- */}
          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status Booking Lapangan</label>
             <div className="flex gap-3">
                 <button
                    type="button"
                    onClick={() => setIsVenueBooked(true)}
                    className={`flex-1 py-3 px-2 rounded-xl border font-bold text-xs transition flex flex-col items-center justify-center gap-1 ${
                        isVenueBooked 
                        ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500' 
                        : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                    }`}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    Sudah Booking
                 </button>
                 <button
                    type="button"
                    onClick={() => setIsVenueBooked(false)}
                    className={`flex-1 py-3 px-2 rounded-xl border font-bold text-xs transition flex flex-col items-center justify-center gap-1 ${
                        !isVenueBooked 
                        ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500' 
                        : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                    }`}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    Cari Bareng
                 </button>
             </div>
          </div>

          {/* INPUT UPLOAD BUKTI (Hanya muncul jika Sudah Booking) */}
          {isVenueBooked && (
              <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 animate-fade-in-down">
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                      Upload Bukti Booking / DP
                      <span className="text-gray-400 font-normal ml-1 normal-case">(Opsional)</span>
                  </label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files[0])}
                    className="block w-full text-xs text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-xs file:font-bold
                      file:bg-blue-600 file:text-white
                      hover:file:bg-blue-700 transition cursor-pointer
                    "
                  />
                  {proofFile && (
                      <p className="text-xs text-green-600 mt-2 font-bold flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          File dipilih: {proofFile.name}
                      </p>
                  )}
              </div>
          )}

          {/* --- BAGIAN 4: SISTEM BAYAR --- */}
          {/* --- BAGIAN 4: SISTEM BAYAR (MODERN CARDS) --- */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Sistem Pembayaran</label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Opsi 1: Patungan (Split) */}
                <div 
                    onClick={() => setFormData({...formData, fee_type: 'Split'})}
                    className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all ${
                        formData.fee_type === 'Split' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' 
                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                >
                    {/* Icon Handshake/Coins (SVG) */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg>
                    <span className="text-xs font-bold text-center">Patungan (50:50)</span>
                </div>

                {/* Opsi 2: Kalah Bayar (LoserPays) */}
                <div 
                    onClick={() => setFormData({...formData, fee_type: 'LoserPays'})}
                    className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all ${
                        formData.fee_type === 'LoserPays' 
                        ? 'border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500' 
                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                >
                    {/* Icon Skull (SVG) */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="15" cy="12" r="1"></circle><path d="M8 20v2h8v-2"></path><path d="M12.5 17l-.5-4"></path><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"></path></svg>
                    <span className="text-xs font-bold text-center">Yang Kalah Bayar</span>
                </div>

                {/* Opsi 3: Tuan Rumah Bayar (HostPays) */}
                <div 
                    onClick={() => setFormData({...formData, fee_type: 'HostPays'})}
                    className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all ${
                        formData.fee_type === 'HostPays' 
                        ? 'border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500' 
                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                >
                    {/* Icon Crown (SVG) */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path></svg>
                    <span className="text-xs font-bold text-center">Tuan Rumah Bayar</span>
                </div>

            </div>
          </div>

          {/* --- BAGIAN 5: TOMBOL AKSI --- */}
          <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
            <Link 
                href="/" 
                className="w-1/3 bg-white border border-gray-200 text-gray-600 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition text-center flex items-center justify-center text-sm"
            >
                Batal
            </Link>

            <button 
                type="submit" 
                disabled={loading}
                className="w-2/3 bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-300 text-sm flex items-center justify-center gap-2"
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Memproses...
                    </span>
                ) : (
                    <>
                        <span>Posting Tantangan</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </>
                )}
            </button>
          </div>
          
        </form>
      </div>

      {/* --- MODAL KUOTA PENUH (MODERN UI) --- */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
           
           {/* Kotak Modal */}
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100">
              
              {/* Icon Peringatan Besar */}
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                 <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center animate-bounce-slow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                 </div>
              </div>

              {/* Teks Pesan */}
              <div className="text-center mb-8">
                 <h3 className="text-xl font-black text-gray-900 mb-2">
                    Kuota Jadwal Penuh!
                 </h3>
                 <p className="text-gray-500 text-sm leading-relaxed">
                    Anda memiliki <strong className="text-red-600">{currentCount} jadwal aktif</strong> yang belum selesai. Agar tidak nyepam, tolong selesaikan atau hapus jadwal lama dulu ya.
                 </p>
              </div>

              {/* Tombol Aksi */}
              <div className="space-y-3">
                 <Link 
                    href="/dashboard" 
                    className="block w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl text-center shadow-lg shadow-red-200 transition transform active:scale-95"
                 >
                    Atur di Dashboard
                 </Link>
                 
                 <button 
                    onClick={() => setShowLimitModal(false)}
                    className="block w-full bg-white border border-gray-200 text-gray-500 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition"
                 >
                    Mengerti, Batal Dulu
                 </button>
              </div>

           </div>
        </div>
      )}

      {/* --- MODAL NOTIFIKASI (SUKSES / ERROR) --- */}
      {notification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in">
           
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 flex flex-col items-center text-center">
              
              {/* ICON DINAMIS */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${notification.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                 {notification.type === 'success' ? (
                    // ICON SUKSES (Rocket / Fire)
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

              {/* TOMBOL AKSI */}
              <button 
                 onClick={() => {
                     // Jika tipe sukses, arahkan ke beranda saat ditutup
                     if (notification.type === 'success') {
                         router.push('/')
                     }
                     setNotification(null)
                 }}
                 className={`w-full py-3.5 rounded-xl font-bold text-white transition shadow-lg transform active:scale-95 ${
                    notification.type === 'success' 
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
                    : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                 }`}
              >
                 {notification.type === 'success' ? 'Kembali ke Beranda' : 'Coba Lagi'}
              </button>

           </div>
        </div>
      )}
    </div>
  )
}