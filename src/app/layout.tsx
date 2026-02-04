import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer"; // Pastikan file src/components/Footer.jsx sudah dibuat

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Futsal Sparring App",
  description: "Cari lawan futsal di kotamu dengan mudah.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* SETUP LAYOUT UTAMA (Sticky Footer):
        - flex flex-col: Mengatur elemen jadi vertikal.
        - min-h-screen: Tinggi minimal body = 100% tinggi layar.
      */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        
        {/* 1. Navbar (Selalu di atas) */}
        <Navbar />

        {/* 2. Konten Utama (Main)
            - flex-1: Mengambil sisa ruang kosong agar Footer terdorong ke bawah.
            - bg-gray-50: Warna background dasar aplikasi (abu-abu tipis).
        */}
        <main className="flex-1 bg-gray-50">
          {children}
        </main>

        {/* 3. Footer (Selalu di bawah) */}
        <Footer />
        
      </body>
    </html>
  );
}