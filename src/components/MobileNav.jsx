// src/components/MobileNav.jsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 w-full z-[100] md:hidden pb-safe">
      
{/* 1. LAYER FAB BUTTON (Posisi Absolute di Tengah Atas) */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-6 group cursor-pointer">
        <Link href="/matches/create">
            <div className="relative flex items-center justify-center w-14 h-14">
                
                {/* ANIMASI 1: Ping / Radar Effect (Berdenyut terus menerus) */}
                {/* Lingkaran ini akan membesar dan memudar berulang-ulang */}
                <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20 animate-ping"></span>

                {/* ANIMASI 2: Static Glow (Cahaya di belakang) */}
                {/* Memberikan kesan neon/bersinar */}
                <div className="absolute inset-1 rounded-full bg-blue-500 blur-md opacity-40 group-hover:opacity-80 transition-opacity duration-500"></div>

                {/* BUTTON UTAMA */}
                <button className="relative w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full text-white shadow-xl shadow-blue-500/30 flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-active:scale-95 border-4 border-gray-50 z-10">
                    
                    {/* ANIMASI 3: Icon Rotation (Berputar saat disentuh/hover) */}
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="28" 
                        height="28" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="transition-transform duration-500 ease-out group-hover:rotate-180" 
                    >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>

                </button>
            </div>
        </Link>
      </div>

      {/* 2. LAYER MENU BAR */}
      <div className="bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] h-16 px-6">
        <div className="grid grid-cols-3 h-full items-center">
            
            {/* KIRI: HOME */}
            <div className="justify-self-start w-20"> {/* Lebar ditambah dikit biar container pill muat */}
                <NavItem 
                    href="/" 
                    icon={<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>} 
                    label="Home" 
                    isActive={pathname === '/'}
                />
            </div>

            {/* TENGAH: KOSONG */}
            <div className="flex justify-center pointer-events-none">
                <span className="mt-9 text-[10px] font-bold text-gray-400">Buat Jadwal Baru</span>
            </div>

            {/* KANAN: AKUN / TIM SAYA */}
            <div className="justify-self-end w-20">
                <NavItem 
                    href="/dashboard" 
                    // ICON: Tameng (Shield) - Representasi Klub/Tim
                    icon={
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    } 
                    // LABEL: Saya sarankan "Tim Saya" atau "Klub", tapi "Akun" juga oke.
                    label="Tim" 
                    isActive={pathname === '/dashboard'}
                />
            </div>

        </div>
      </div>
    </div>
  )
}

// --- KOMPONEN NAV ITEM DENGAN BACKGROUND PILL ---
function NavItem({ href, icon, label, isActive }) {
    return (
        <Link href={href} className="flex flex-col items-center justify-center w-full h-full group">
            
            {/* CONTAINER ICON (Ini yang berubah warna backgroundnya) */}
            <div className={`
                flex items-center justify-center 
                w-12 h-8 rounded-2xl mb-1 transition-all duration-300
                ${isActive 
                    ? 'bg-blue-100 text-blue-600 shadow-sm' // AKTIF: Background Biru Muda, Icon Biru
                    : 'bg-transparent text-gray-400 group-hover:bg-gray-50' // MATI: Transparan
                }
            `}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
                    {icon}
                </svg>
            </div>

            {/* LABEL TEKS */}
            <span className={`text-[10px] font-bold transition-colors duration-300 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                {label}
            </span>
        </Link>
    )
}