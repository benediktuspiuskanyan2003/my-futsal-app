// src/app/matches/[id]/edit/page.jsx
'use client'
import { useState, useEffect, use } from 'react' // Tambah use untuk params
import { supabase } from '../../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditMatch({ params }) {
  // Unwrapping params (Next.js 15 rules)
  const { id } = use(params)

  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [notification, setNotification] = useState(null)

  
  // Data State
  const [matchData, setMatchData] = useState(null)
  
  // Form State
  const [formData, setFormData] = useState({
    play_date: '',
    play_time: '',
    location_name: '',
    fee_type: ''
  })
  
  // State Booking
  const [isVenueBooked, setIsVenueBooked] = useState(false)
  const [proofFile, setProofFile] = useState(null)
  const [oldProofUrl, setOldProofUrl] = useState(null) // Simpan URL lama


  useEffect(() => {
    const fetchMatch = async () => {
      // 1. Cek Login
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      // 2. Ambil Data Match Lama
      const { data, error } = await supabase
        .from('matches')
        .select('*, teams(*)')
        .eq('id', id)
        .single()

      if (error || !data) {
        setNotification({
            type: 'error',
            title: 'Data Tidak Ditemukan',
            message: 'Jadwal pertandingan ini mungkin sudah dihapus atau tidak valid.',
            redirect: '/' // Kita simpan tujuan redirect di sini
        })
        return router.push('/')
      }

      // 3. Cek Kepemilikan (Security di Frontend)
      if (data.user_id !== user.id) {
        setNotification({
            type: 'error',
            title: 'Akses Ditolak',
            message: 'Eits! Anda tidak memiliki izin untuk mengedit postingan ini.',
            redirect: '/' 
        })
        return router.push('/')
      }

      // 4. Masukkan Data Lama ke Form (Pre-fill)
      setMatchData(data)
      setFormData({
        play_date: data.play_date,
        play_time: data.play_time,
        location_name: data.location_name,
        fee_type: data.fee_type,
        description: data.description || ''
      })
      setIsVenueBooked(data.is_venue_booked)
      setOldProofUrl(data.booking_proof_url)
      
      setLoading(false)
    }

    fetchMatch()
  }, [id, router])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setUpdating(true)

    try {
      let finalProofUrl = oldProofUrl

      // A. LOGIKA GANTI GAMBAR (Jika user upload file baru)
      if (isVenueBooked && proofFile) {
        const fileExt = proofFile.name.split('.').pop()
        const fileName = `${Date.now()}_EDIT.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('match-proofs')
            .upload(filePath, proofFile)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
            .from('match-proofs')
            .getPublicUrl(filePath)
        
        finalProofUrl = urlData.publicUrl
      } 
      // B. Jika user ubah jadi "Belum Booking", hapus URL buktinya
      else if (!isVenueBooked) {
        finalProofUrl = null
      }

      // C. UPDATE DATABASE
      const { error } = await supabase
        .from('matches')
        .update({
            play_date: formData.play_date,
            play_time: formData.play_time,
            location_name: formData.location_name,
            fee_type: formData.fee_type,
            description: formData.description,
            is_venue_booked: isVenueBooked,
            booking_proof_url: finalProofUrl
        })
        .eq('id', id) // KUNCI: Update berdasarkan ID

      if (error) throw error

      setNotification({
        type: 'success',
        title: 'Perubahan Disimpan! ✅',
        message: 'Data jadwal pertandingan berhasil diperbarui.',
        redirect: `/matches/${id}` // Balik ke detail match
      }) // Balik ke halaman detail

    } catch (error) {
      // ERROR UPDATE -> Pop up Merah
      setNotification({
        type: 'error',
        title: 'Gagal Update',
        message: error.message
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="pt-32 text-center">Memuat data lama...</div>

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 flex justify-center">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-lg h-fit">
        
        <h2 className="text-2xl font-black mb-6 text-gray-900 tracking-tight flex items-center gap-3">
             <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </div>
            Edit Jadwal
        </h2>
        
        <form onSubmit={handleUpdate} className="space-y-5">
          
          {/* INFO TIM (Read Only) */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 opacity-70">
               <p className="text-xs font-bold text-gray-400 uppercase">Tim Anda</p>
               <p className="text-lg font-bold text-gray-800">{matchData?.teams?.name}</p>
          </div>

          {/* INPUT TANGGAL & JAM */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal</label>
              <input type="date" required className="w-full p-3 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.play_date}
                onChange={(e) => setFormData({...formData, play_date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jam</label>
              <input type="time" required className="w-full p-3 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.play_time}
                onChange={(e) => setFormData({...formData, play_time: e.target.value})}
              />
            </div>
          </div>

          {/* LOKASI */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lokasi</label>
            <input type="text" required className="w-full p-3 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none" 
              value={formData.location_name}
              onChange={(e) => setFormData({...formData, location_name: e.target.value})}
            />
          </div>

          {/* STATUS BOOKING & UPLOAD */}
          {/* --- 1. STATUS BOOKING (DENGAN ICON) --- */}
          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status Booking</label>
             <div className="flex gap-4 mb-4">
                 
                 {/* Tombol SUDAH BOOKING */}
                 <button
                    type="button"
                    onClick={() => setIsVenueBooked(true)}
                    className={`flex-1 py-4 px-2 rounded-xl border-2 font-bold text-xs transition flex flex-col items-center justify-center gap-2 ${
                        isVenueBooked 
                        ? 'bg-green-50 border-green-500 text-green-700' 
                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                 >
                    {/* Icon Check Circle */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Sudah Booking
                 </button>

                 {/* Tombol CARI BARENG */}
                 <button
                    type="button"
                    onClick={() => setIsVenueBooked(false)}
                    className={`flex-1 py-4 px-2 rounded-xl border-2 font-bold text-xs transition flex flex-col items-center justify-center gap-2 ${
                        !isVenueBooked 
                        ? 'bg-orange-50 border-orange-500 text-orange-700' 
                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                 >
                    {/* Icon Alert Circle */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    Cari Bareng
                 </button>
             </div>

             {/* Input Upload Bukti (Muncul jika Sudah Booking) */}
             {isVenueBooked && (
                <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 animate-fade-in-down">
                    <label className="block text-xs font-bold text-gray-700 mb-2">Update Bukti Foto (Opsional)</label>
                    
                    {/* Preview Bukti Lama */}
                    {oldProofUrl && !proofFile && (
                        <div className="mb-3 flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                            <span className="text-xs text-gray-400">Foto saat ini:</span>
                            <a href={oldProofUrl} target="_blank" className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                Lihat Gambar
                            </a>
                        </div>
                    )}

                    <input type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files[0])}
                        className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition cursor-pointer"
                    />
                </div>
             )}
          </div>

          {/* --- 2. SISTEM PEMBAYARAN (DENGAN ICON) --- */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Sistem Pembayaran</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Opsi 1: Patungan (Split) - Icon Dollar */}
                <div 
                    onClick={() => setFormData({...formData, fee_type: 'Split'})}
                    className={`cursor-pointer rounded-xl border-2 p-3 flex flex-col items-center justify-center gap-2 transition-all ${
                        formData.fee_type === 'Split' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg>
                    <span className="text-[10px] sm:text-xs font-bold text-center">Patungan (50:50)</span>
                </div>

                {/* Opsi 2: Kalah Bayar (LoserPays) - Icon Skull */}
                <div 
                    onClick={() => setFormData({...formData, fee_type: 'LoserPays'})}
                    className={`cursor-pointer rounded-xl border-2 p-3 flex flex-col items-center justify-center gap-2 transition-all ${
                        formData.fee_type === 'LoserPays' 
                        ? 'border-red-500 bg-red-50 text-red-700' 
                        : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="15" cy="12" r="1"></circle><path d="M8 20v2h8v-2"></path><path d="M12.5 17l-.5-4"></path><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"></path></svg>
                    <span className="text-[10px] sm:text-xs font-bold text-center">Yang Kalah Bayar</span>
                </div>

                {/* Opsi 3: Tuan Rumah Bayar (HostPays) - Icon Crown */}
                <div 
                    onClick={() => setFormData({...formData, fee_type: 'HostPays'})}
                    className={`cursor-pointer rounded-xl border-2 p-3 flex flex-col items-center justify-center gap-2 transition-all ${
                        formData.fee_type === 'HostPays' 
                        ? 'border-purple-500 bg-purple-50 text-purple-700' 
                        : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path></svg>
                    <span className="text-[10px] sm:text-xs font-bold text-center">Tuan Rumah Bayar</span>
                </div>

            </div>
          </div>

          {/* TOMBOL AKSI */}
          <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
            <Link href={`/matches/${id}`} className="w-1/3 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition text-center text-sm flex items-center justify-center">
                Batal
            </Link>
            <button type="submit" disabled={updating}
                className="w-2/3 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 text-sm flex items-center justify-center gap-2">
                {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
          
        </form>
      </div>

      {/* --- MODAL NOTIFIKASI (MODERN UI) --- */}
      {notification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in">
           
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 flex flex-col items-center text-center">
              
              {/* ICON DINAMIS */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${notification.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                 {notification.type === 'success' ? (
                    <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                 ) : (
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
                     // Logika Redirect Pintar
                     if (notification.redirect) {
                         router.push(notification.redirect)
                     }
                     setNotification(null)
                 }}
                 className={`w-full py-3.5 rounded-xl font-bold text-white transition shadow-lg transform active:scale-95 ${
                    notification.type === 'success' 
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
                    : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                 }`}
              >
                 {notification.type === 'success' ? 'Lanjut' : 'Kembali'}
              </button>

           </div>
        </div>
      )}

    </div>
  )
}