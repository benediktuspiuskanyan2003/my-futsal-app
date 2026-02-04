// src/app/privacy/page.jsx
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 pt-24">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Kebijakan Privasi</h1>
        <p className="text-gray-500 mb-8 text-sm">Kami menghargai privasi Anda.</p>
        
        <div className="space-y-6 text-gray-700">
          <section>
            <h3 className="font-bold text-lg text-gray-900 mb-2">1. Data yang Kami Kumpulkan</h3>
            <p>Kami mengumpulkan data berikut untuk keperluan operasional aplikasi:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Alamat Email (untuk Login).</li>
                <li>Nomor WhatsApp (agar lawan bisa menghubungi Anda).</li>
                <li>Data Tim (Nama, Kota, Logo, Foto Sampul).</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg text-gray-900 mb-2">2. Penggunaan Data</h3>
            <p>Data Nomor WhatsApp Anda akan ditampilkan secara publik di halaman detail pertandingan agar tim lawan dapat menghubungi Anda untuk sparring. Kami tidak menjual data Anda ke pihak ketiga.</p>
          </section>

          <section>
            <h3 className="font-bold text-lg text-gray-900 mb-2">3. Keamanan</h3>
            <p>Kami menggunakan layanan pihak ketiga (Supabase) yang memiliki standar keamanan tinggi untuk menyimpan data Anda.</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100">
            <Link href="/" className="text-blue-600 font-bold hover:underline">&larr; Kembali ke Beranda</Link>
        </div>
      </div>
    </div>
  )
}