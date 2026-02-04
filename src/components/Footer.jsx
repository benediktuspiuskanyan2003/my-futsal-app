// src/components/Footer.jsx
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* LAYOUT GRID:
            - Mobile: 1 Kolom
            - Tablet (md): 2 Kolom
            - Desktop (lg): 5 Kolom (Supaya muat Logo 2 slot + Menu + Bantuan + Kontak)
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            
            {/* 1. LOGO & DESKRIPSI (Memakai 2 Slot Kolom di Desktop) */}
            <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                    </div>
                    <span className="text-xl font-black text-gray-900 tracking-tight">SparringFutsal</span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
                    Solusi digital untuk anak futsal. Kami membantu tim kamu menemukan lawan tanding yang sepadan dengan mudah dan cepat.
                </p>
            </div>

            {/* 2. MENU UTAMA */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Menu Utama</h3>
                <ul className="space-y-3">
                    <li><Link href="/" className="text-gray-500 hover:text-blue-600 text-sm font-medium transition">Cari Lawan</Link></li>
                    <li><Link href="/matches/create" className="text-gray-500 hover:text-blue-600 text-sm font-medium transition">Buat Jadwal Baru</Link></li>
                    <li><Link href="/dashboard" className="text-gray-500 hover:text-blue-600 text-sm font-medium transition">Dashboard Tim</Link></li>
                </ul>
            </div>

            {/* 3. BANTUAN */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Bantuan</h3>
                <ul className="space-y-3">
                    <li>
                        <Link href="/guide" className="text-gray-500 hover:text-blue-600 text-sm font-medium transition">Panduan Penggunaan</Link>
                    </li>
                    <li>
                        <Link href="/terms" className="text-gray-500 hover:text-blue-600 text-sm font-medium transition">Syarat & Ketentuan</Link>
                    </li>
                    <li>
                        <Link href="/privacy" className="text-gray-500 hover:text-blue-600 text-sm font-medium transition">Kebijakan Privasi</Link>
                    </li>
                </ul>
            </div>

            {/* 4. KONTAK & SOSMED (Code Baru Anda) */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Hubungi Kami</h3>
                <div className="space-y-4">
                    {/* Tombol WA Admin */}
                    <a 
                        href={`https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_WA || '6281234567890'}`} // Fallback number jika env belum di-set
                        target="_blank"
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50 transition group bg-white shadow-sm"
                    >
                        <div className="bg-green-100 text-green-600 p-2 rounded-full group-hover:bg-green-500 group-hover:text-white transition">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold">Butuh Bantuan?</p>
                            <p className="text-sm font-bold text-gray-900">Chat Admin</p>
                        </div>
                    </a>

                    {/* Social Icons */}
                    <div className="flex gap-4">
                        <a href="#" className="text-gray-400 hover:text-pink-600 transition p-2 hover:bg-pink-50 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                        </a>
                        <a href="#" className="text-gray-400 hover:text-blue-500 transition p-2 hover:bg-blue-50 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>

        {/* COPYRIGHT */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-xs">
                &copy; {new Date().getFullYear()} SparringFutsal. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-400">
                <span>Dibuat dengan ❤️ untuk Komunitas Futsal Indonesia.</span>
            </div>
        </div>

      </div>
    </footer>
  )
}