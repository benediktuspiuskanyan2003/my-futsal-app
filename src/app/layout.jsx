// src/app/layout.jsx
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer"; 
import MobileNav from '../components/MobileNav'; // <-- Import MobileNav

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SparZone - Cari Lawan Futsal",
  description: "Aplikasi cari lawan sparring futsal terpercaya. Temukan tim sepadan di kotamu sekarang!",
  openGraph: {
    title: 'SparZone - Cari Lawan Futsal',
    description: 'Jangan biarkan jadwal kosong. Gas sparring sekarang!',
    url: 'https://sparzone.vercel.app', 
    siteName: 'SparZone',
    images: [
      {
        url: 'https://link-ke-gambar-banner-anda.com/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
};

// Hapus tipe TypeScript ": Readonly<...>" agar menjadi JS murni
export default function RootLayout({ children }) {
  return (
    <html lang="id"> 
      {/* Ubah lang="en" jadi "id" (Indonesia) agar SEO lebih baik untuk lokal */}
      
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        
        {/* 1. Navbar Atas (Akan otomatis sembunyi/muncul sesuai logic di dalam Navbar.jsx jika Anda mengaturnya, 
            tapi biasanya Navbar atas tetap ada di HP juga tidak masalah) */}
        <Navbar />

        {/* 2. Konten Utama 
            - flex-1: Isi ruan g kosong.
            - bg-gray-50: Warnadasar.
            - pb-24: PENDING PENTING! Memberi jarak bawah di HP agar konten paling bawah 
                     tidak tertutup oleh Mobile Nav bar.
            - md:pb-0: Di laptop jarak bawahnya dinolkan (karena tidak ada Mobile Nav).
        */}
        <main className="flex-1 bg-gray-50 pb-24 md:pb-0">
          {children}
        </main>

        {/* 3. Footer (Opsional: Bisa disembunyikan di HP jika mau, tambah 'hidden md:block') */}
        <div className="hidden md:block"> 
           {/* Saya set hidden di HP agar tidak menumpuk dengan Mobile Nav, 
               tapi kalau mau tetap muncul di HP, hapus className ini */}
           <Footer />
        </div>

        {/* 4. Mobile Navigation (Hanya muncul di HP) */}
        <MobileNav />
        
      </body>
    </html>
  );
}