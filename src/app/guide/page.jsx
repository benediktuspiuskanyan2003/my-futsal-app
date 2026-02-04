// src/app/guide/page.jsx
import Link from 'next/link'

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 pt-24">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
        <h1 className="text-3xl font-black text-gray-900 mb-6">Panduan Penggunaan</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-blue-600 mb-2">1. Bagaimana cara membuat tim?</h2>
            <p className="text-gray-600 leading-relaxed">
              Masuk ke halaman Dashboard, lalu isi nama tim dan kota homebase Anda pada formulir yang tersedia. 
              Pastikan Anda menyimpan data profil tim sebelum mulai mencari lawan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-600 mb-2">2. Cara memposting jadwal sparring?</h2>
            <p className="text-gray-600 leading-relaxed">
              Klik menu "Buat Jadwal" atau ikon (+) di navigasi. Isi tanggal, jam, dan lokasi lapangan. 
              Jika Anda sudah membooking lapangan, Anda bisa mengunggah bukti booking agar calon lawan lebih percaya.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-600 mb-2">3. Bagaimana cara menghubungi lawan?</h2>
            <p className="text-gray-600 leading-relaxed">
              Pilih jadwal yang cocok di halaman Beranda, klik tombol "Lihat Detail", lalu tekan tombol "Hubungi Lawan". 
              Anda akan diarahkan langsung ke WhatsApp manager tim tersebut.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100">
            <Link href="/" className="text-blue-600 font-bold hover:underline">&larr; Kembali ke Beranda</Link>
        </div>
      </div>
    </div>
  )
}