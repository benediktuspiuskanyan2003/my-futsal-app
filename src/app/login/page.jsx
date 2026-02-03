'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // State untuk atur mode: Login atau Daftar?
  const [isLoginMode, setIsLoginMode] = useState(true)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLoginMode) {
        // --- LOGIKA LOGIN (MASUK) ---
        const { error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        })
        if (error) throw error
        
        // Sukses Login -> Masuk Dashboard
        router.push('/dashboard') 
      
      } else {
        // --- LOGIKA DAFTAR (SIGN UP) ---
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
        })
        if (error) throw error
        
        alert('Akun berhasil dibuat! Anda otomatis login.')
        router.push('/dashboard')
      }
    } catch (error) {
      alert('Gagal: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        
        {/* Header Dinamis */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {isLoginMode ? 'Selamat Datang Kembali 👋' : 'Buat Akun Baru 🚀'}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {isLoginMode 
              ? 'Masuk untuk mengelola tim futsal Anda.' 
              : 'Gabung komunitas futsal dan cari lawan sparring!'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              className="w-full p-3 border rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full p-3 border rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            {loading ? 'Memproses...' : (isLoginMode ? 'Masuk Sekarang' : 'Daftar Akun')}
          </button>
        </form>

        {/* Tombol Ganti Mode (Toggle) */}
        <div className="mt-6 text-center text-sm border-t pt-4">
          <p className="text-gray-600">
            {isLoginMode ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <button 
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-blue-600 font-bold hover:underline ml-1"
            >
              {isLoginMode ? 'Daftar di sini' : 'Login di sini'}
            </button>
          </p>
        </div>
        
        <div className="mt-4 text-center">
             <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
                &larr; Kembali ke Beranda
             </Link>
        </div>

      </div>
    </div>
  )
}