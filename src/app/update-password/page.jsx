'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function UpdatePassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Cek apakah ada session? (Link dari email otomatis membuat user login sementara)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Jika tidak ada session (user akses langsung tanpa link email), tendang ke login
        router.push('/login')
      }
    })
  }, [])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Fungsi Update User (Password Baru)
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      })

      if (error) throw error

      // Sukses, arahkan ke dashboard
      router.push('/dashboard')

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 pt-20">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        
        <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-gray-900">Password Baru</h2>
            <p className="text-gray-500 text-sm mt-2">Silakan masukkan password baru Anda.</p>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold text-center border border-red-100">
                {error}
            </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Password Baru</label>
                <input 
                    type="password" 
                    required 
                    minLength={6}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/30 transition transform active:scale-95"
            >
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
        </form>

      </div>
    </div>
  )
}