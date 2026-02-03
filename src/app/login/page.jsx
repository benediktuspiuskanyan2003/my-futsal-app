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
  const [showPassword, setShowPassword] = useState(false) // Fitur lihat password
  
  // State Mode: Login vs Daftar
  const [isLoginMode, setIsLoginMode] = useState(true)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLoginMode) {
        // --- LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard') 
      } else {
        // --- DAFTAR ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        alert('Akun berhasil dibuat! Silakan cek email atau login langsung.')
        router.push('/dashboard')
      }
    } catch (error) {
      alert('Gagal: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white pt-20 md:pt-20">
      
      {/* BAGIAN KIRI: IMAGE & BRANDING (Hidden di HP, Muncul di Laptop) */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center">
         {/* Background Pattern / Gradient */}
         <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-indigo-900 z-0"></div>
         
         {/* Dekorasi Visual (Bola Abstrak) */}
         <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
         <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

         <div className="relative z-10 text-center px-10 text-white">
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">
                Sparring<span className="text-blue-200">Futsal</span>
            </h2>
            <p className="text-lg text-blue-100 max-w-md mx-auto leading-relaxed">
                "Jangan biarkan timmu menganggur. Temukan lawan tanding sepadan dan perluas jaringan lewat olahraga."
            </p>
            
            {/* Illustrasi Icon Besar */}
            <div className="mt-10 flex justify-center opacity-80">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
         </div>
      </div>

      {/* BAGIAN KANAN: FORM LOGIN */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative">
        
        {/* TOMBOL KEMBALI (Pojok Kiri Atas) */}
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-black transition group">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </div>
            <span className="text-sm font-bold">Kembali</span>
        </Link>

        <div className="w-full max-w-md space-y-8">
            
            {/* Header Form */}
            <div className="text-center">
                <div className="inline-block p-3 rounded-2xl bg-blue-50 text-blue-600 mb-4">
                    {/* Icon User / Add User Dynamic */}
                    {isLoginMode ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                    )}
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                    {isLoginMode ? 'Selamat Datang' : 'Buat Akun Baru'}
                </h2>
                <p className="mt-2 text-gray-500">
                    {isLoginMode ? 'Masuk untuk mengatur jadwal tim.' : 'Daftar gratis dan mulai cari lawan sparring.'}
                </p>
            </div>

            {/* Form Input */}
            <form onSubmit={handleAuth} className="space-y-5">
                
                {/* Email Field */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        </div>
                        <input
                            type="email"
                            required
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-medium text-gray-900 placeholder-gray-400"
                            placeholder="nama@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                {/* Password Field */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={6}
                            className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-medium text-gray-900 placeholder-gray-400"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {/* Toggle Show Password */}
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Tombol Login/Register */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition transform active:scale-95 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        isLoginMode ? 'Masuk ke Dashboard' : 'Daftar Sekarang'
                    )}
                </button>
            </form>

            {/* Toggle Switch Login/Register */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-500 text-sm">
                    {isLoginMode ? 'Belum punya akun tim?' : 'Sudah punya akun?'}
                    <button 
                        onClick={() => {
                            setIsLoginMode(!isLoginMode);
                            setPassword(''); // Reset password field
                        }}
                        className="ml-2 font-bold text-blue-600 hover:text-blue-700 hover:underline transition"
                    >
                        {isLoginMode ? 'Daftar Gratis' : 'Login disini'}
                    </button>
                </p>
            </div>

        </div>
      </div>
    </div>
  )
}