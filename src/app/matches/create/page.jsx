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
  
  // State untuk menyimpan data Tim milik user (jika ada)
  const [myTeam, setMyTeam] = useState(null)

  const [formData, setFormData] = useState({
    play_date: '',
    play_time: '',
    location_name: '',
    fee_type: 'Split',
    // Field khusus user baru
    new_team_name: '',
    new_team_city: ''
  })

  // 1. Cek Login & Cek Apakah User Sudah Punya Tim?
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      
      setUser(user)

      // Cek ke database teams
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('manager_id', user.id)
        .single() // Ambil satu saja

      if (teamData) {
        setMyTeam(teamData) // User sudah punya tim!
      }
      
      setLoading(false)
    }
    checkSession()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      let teamIdToUse = myTeam?.id

      // Skenario A: User Belum Punya Tim (Buat Tim Dulu)
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

      // Skenario B: Simpan Jadwal (Pakai ID Tim yang sudah ada/baru)
      const { error: matchError } = await supabase
        .from('matches')
        .insert([{
          team_id: teamIdToUse,
          play_date: formData.play_date,
          play_time: formData.play_time,
          location_name: formData.location_name,
          fee_type: formData.fee_type,
          status: 'Open'
        }])

      if (matchError) throw matchError

      alert('Berhasil posting jadwal!')
      router.push('/')

    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p className="p-10 text-center">Memuat data...</p>

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-lg h-fit">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Buat Tantangan Baru 🔥</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* LOGIKA TAMPILAN DINAMIS */}
          {myTeam ? (
            // Jika sudah punya tim, tampilkan Info saja (Read Only)
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
              <p className="text-sm text-blue-600 font-bold">Posting sebagai:</p>
              <p className="text-xl font-bold text-gray-800">{myTeam.name}</p>
              <p className="text-sm text-gray-500">{myTeam.city}</p>
              <div className="mt-2 text-xs text-gray-400">
                *Profil tim otomatis terpakai.
              </div>
            </div>
          ) : (
            // Jika belum punya tim, tampilkan Form Input Tim Baru
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
              <p className="text-sm text-yellow-700 mb-2 font-bold">⚠️ Anda belum punya profil tim</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium">Nama Tim</label>
                  <input required type="text" className="w-full p-2 border rounded" 
                    onChange={(e) => setFormData({...formData, new_team_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Kota Homebase</label>
                  <input required type="text" className="w-full p-2 border rounded" 
                    onChange={(e) => setFormData({...formData, new_team_city: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Jadwal (Selalu Muncul) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tanggal</label>
              <input name="play_date" type="date" required className="w-full p-2 border rounded-lg" 
                onChange={(e) => setFormData({...formData, play_date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Jam</label>
              <input name="play_time" type="time" required className="w-full p-2 border rounded-lg"
                onChange={(e) => setFormData({...formData, play_time: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Lokasi</label>
            <input name="location_name" type="text" required className="w-full p-2 border rounded-lg" placeholder="Nama Lapangan"
              onChange={(e) => setFormData({...formData, location_name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sistem Bayar</label>
            <select name="fee_type" className="w-full p-2 border rounded-lg" 
              onChange={(e) => setFormData({...formData, fee_type: e.target.value})}
            >
              <option value="Split">Patungan (50:50)</option>
              <option value="LoserPays">Kalah Bayar</option>
              <option value="HostPays">Tuan Rumah Bayar</option>
            </select>
          </div>

          {/* --- BAGIAN YANG DIUBAH: DUA TOMBOL --- */}
          <div className="flex gap-3 mt-6">
            {/* Tombol Batal */}
            <Link 
                href="/" 
                className="w-1/3 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition text-center flex items-center justify-center"
            >
                Batal
            </Link>

            {/* Tombol Submit */}
            <button 
                type="submit" 
                disabled={loading}
                className="w-2/3 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
            >
                {loading ? 'Sedang Posting...' : 'Posting Tantangan'}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  )
}