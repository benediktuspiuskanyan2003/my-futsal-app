// src/app/register/page.jsx
'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('') 
  const [showPassword, setShowPassword] = useState(false) // Tambah fitur lihat password
  const [notification, setNotification] = useState(null)

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setNotification(null)

    try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
            data: { full_name: fullName } 
          }
        })
        
        if (error) throw error
        
        if (data.user && data.user.identities && data.user.identities.length === 0) {
             throw new Error('Email ini sudah terdaftar. Silakan login.')
        }

        setNotification({
            type: 'success',
            title: 'Cek Email Anda! 📧',
            message: 'Link konfirmasi telah dikirim. Wajib klik link tersebut sebelum login.'
        })

    } catch (error) {
      setNotification({
        type: 'error',
        title: 'Gagal Daftar',
        message: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white pt-18"> {/* Padding Top Konsisten */}
      
      {/* BAGIAN KIRI: BRANDING (Nuansa Indigo/Ungu) */}
      <div className="hidden lg:flex w-1/2 bg-indigo-900 relative overflow-hidden items-center justify-center">
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 z-0"></div>
         
         {/* Dekorasi Visual */}
         <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
         <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

         <div className="relative z-10 text-center px-10 text-white">
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">
                Gabung <span className="text-yellow-400">Komunitas</span>
            </h2>
            <p className="text-lg text-indigo-100 max-w-md mx-auto leading-relaxed">
                "Temukan lawan tanding yang sepadan di kotamu dan perluas jaringan tim futsalmu."
            </p>
            
            {/* Illustrasi Icon Besar (User Plus) */}
            <div className="mt-10 flex justify-center opacity-80">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
            </div>
         </div>
      </div>

      {/* BAGIAN KANAN: FORM REGISTER */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative">

        <div className="w-full max-w-md space-y-8">
            
            {/* Header Form dengan Logo SVG */}
            <div className="text-center">
                <div className="inline-block p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-sm border border-indigo-100">
                    {/* SVG Logo Modern (User Plus) */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Buat Akun Baru</h2>
                <p className="mt-2 text-gray-500">Isi data tim/manager untuk memulai.</p>
            </div>

            {/* FORM */}
            {!notification ? (
                <form onSubmit={handleRegister} className="space-y-4">
                    
                    {/* Input Nama Manager (Diperjelas) */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap (Manager)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                {/* Icon User */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </div>
                            <input 
                                type="text" 
                                required 
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition font-medium text-gray-900 placeholder-gray-400" 
                                // Placeholder diganti agar jelas ini nama orang
                                placeholder="Cth: Budi Santoso" 
                                value={fullName} 
                                onChange={(e) => setFullName(e.target.value)} 
                            />
                        </div>
                    </div>

                    {/* Input Email */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            </div>
                            <input 
                                type="email" 
                                required 
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition font-medium text-gray-900 placeholder-gray-400" 
                                placeholder="nama@email.com" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                            />
                        </div>
                    </div>

                    {/* Input Password */}
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
                                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition font-medium text-gray-900 placeholder-gray-400" 
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

                    {/* Tombol Submit */}
                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/30 transition transform active:scale-95 flex items-center justify-center gap-2">
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            'Daftar Sekarang'
                        )}
                    </button>
                </form>
            ) : (
                // TAMPILAN SUKSES CEK EMAIL (Modern)
                <div className="text-center bg-green-50 p-8 rounded-3xl border border-green-100 animate-fade-in-up">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Cek Email Kamu!</h3>
                    <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                        Link verifikasi telah dikirim ke <span className="font-bold text-green-700">{email}</span>.<br/>Klik link tersebut untuk mengaktifkan akun tim kamu.
                    </p>
                    <Link href="/login" className="inline-flex items-center gap-2 bg-green-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 transition transform hover:-translate-y-1">
                        Ke Halaman Login &rarr;
                    </Link>
                </div>
            )}

            {!notification && (
                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-gray-500 text-sm">
                        Sudah punya akun? 
                        <Link href="/login" className="ml-2 font-bold text-indigo-600 hover:underline">
                            Login disini
                        </Link>
                    </p>
                </div>
            )}
        </div>
      </div>

      {/* NOTIFIKASI ERROR (Floating Bottom Right) */}
      {notification && notification.type === 'error' && (
        <div className="fixed bottom-5 right-5 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg animate-fade-in-up z-50 max-w-sm">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold">{notification.title}</p>
                    <p className="text-sm mt-1">{notification.message}</p>
                </div>
                <button onClick={() => setNotification(null)} className="text-red-500 hover:text-red-700 font-bold text-xl ml-4">&times;</button>
            </div>
        </div>
      )}
    </div>
  )
}