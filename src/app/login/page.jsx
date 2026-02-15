// src/app/login/page.jsx
'use client'
import { useState, useEffect } from 'react' // Import useEffect
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [notification, setNotification] = useState(null)

  // --- TAMBAHAN BARU: Jaring Pengaman URL Token ---
  // Gunanya: Menangkap user yang mental ke login padahal bawa token reset password
  useEffect(() => {
    // 1. Cek apakah ada error di URL (misal dari Vercel)
    const urlParams = new URLSearchParams(window.location.search);
    const errorMsg = urlParams.get('error');
    const errorDesc = urlParams.get('error_description');

    if (errorMsg) {
       // Tampilkan error jika ada (biar kita tau kenapa gagal)
       setNotification({
         type: 'error',
         title: 'Login Gagal',
         message: errorDesc || errorMsg
       });
    }

    // 2. Cek apakah ada Token Recovery (Ganti Password) di URL Hash (#)
    // Supabase lama suka kirim token lewat #access_token=...
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
        // Redirect manual ke halaman update password
        router.push('/update-password');
    }

    // 3. Listener Auth State (Paling Kuat)
    // Jika Supabase mendeteksi sesi pemulihan, langsung lempar ke update-password
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
            router.push('/update-password');
        }
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, [router]);
  // ------------------------------------------------

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setNotification(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      
      // Login Sukses
      router.push('/dashboard') 
    } catch (error) {
      setNotification({
        type: 'error',
        title: 'Gagal Masuk',
        message: 'Email atau password salah. Silakan cek kembali.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white pt-18"> {/* Added more padding-top (pt-24) to avoid navbar overlap on mobile */}
      
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
                "Masuk dan atur jadwal timmu sekarang. Temukan lawan tanding sepadan."
            </p>
            
            {/* Illustrasi Icon Besar */}
            <div className="mt-10 flex justify-center opacity-80">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
         </div>
      </div>

      {/* BAGIAN KANAN: FORM LOGIN */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative">

        <div className="w-full max-w-md space-y-8">
            
            {/* Header Form dengan Logo SVG */}
            <div className="text-center">
                <div className="inline-block p-3 rounded-2xl bg-blue-50 text-blue-600 mb-4 shadow-sm border border-blue-100">
                    {/* SVG Logo Modern (User Icon) */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Selamat Datang</h2>
                <p className="mt-2 text-gray-500">Masuk untuk mengakses dashboard tim.</p>
            </div>

            {/* Form Input */}
            <form onSubmit={handleLogin} className="space-y-5">
                
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
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-bold text-gray-700">Password</label>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
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

                {/* Link Lupa Password */}
                <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition">
                        Lupa Password?
                    </Link>
                </div>

                {/* Tombol Login */}
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
                        'Masuk ke Dashboard'
                    )}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-500 text-sm">
                    Belum punya akun tim? 
                    <Link href="/register" className="ml-2 font-bold text-blue-600 hover:text-blue-700 hover:underline transition">
                        Daftar Gratis
                    </Link>
                </p>
            </div>

        </div>
      </div>
      
      {/* NOTIFIKASI ERROR (Simpel) */}
      {notification && (
        <div className="fixed bottom-5 right-5 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg animate-fade-in-up z-50">
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