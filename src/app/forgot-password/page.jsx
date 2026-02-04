'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      // 1. Panggil fungsi reset password Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Ganti URL ini dengan URL website Anda nanti saat production
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) throw error

      setMessage('Cek email Anda! Link untuk reset password telah dikirim.')

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 pt-20">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-8">
            <div className="inline-block p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h2 className="text-2xl font-black text-gray-900">Lupa Password?</h2>
            <p className="text-gray-500 text-sm mt-2">Jangan panik. Masukkan email Anda di bawah ini.</p>
        </div>

        {/* Notifikasi Sukses */}
        {message && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm font-bold text-center border border-green-100">
                {message}
            </div>
        )}

        {/* Notifikasi Error */}
        {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold text-center border border-red-100">
                {error}
            </div>
        )}

        {/* Form */}
        <form onSubmit={handleReset} className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Terdaftar</label>
                <input 
                    type="email" 
                    required 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/30 transition transform active:scale-95"
            >
                {loading ? 'Mengirim...' : 'Kirim Link Reset'}
            </button>
        </form>

        {/* Back to Login */}
        <div className="mt-8 text-center">
            <Link href="/login" className="text-sm font-bold text-gray-400 hover:text-gray-600 transition flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Kembali ke Login
            </Link>
        </div>

      </div>
    </div>
  )
}