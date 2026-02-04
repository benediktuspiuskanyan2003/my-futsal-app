// src/app/terms/page.jsx
import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 pt-24">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Syarat & Ketentuan</h1>
        <p className="text-gray-500 mb-8 text-sm">Terakhir diperbarui: Februari 2026</p>
        
        <div className="space-y-6 text-gray-700">
          <p>
            Selamat datang di SparZone (Futsal Sparring App). Dengan mengakses aplikasi ini, Anda menyetujui hal-hal berikut:
          </p>

          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Akun Pengguna:</strong> Anda bertanggung jawab penuh atas keamanan akun dan aktivitas yang terjadi di dalamnya.</li>
            <li><strong>Keakuratan Data:</strong> Anda wajib memberikan data (seperti Nama Tim, No WhatsApp) yang benar dan valid.</li>
            <li><strong>Larangan Keras:</strong> Dilarang menggunakan aplikasi ini untuk tujuan perjudian, penipuan, atau tindakan melanggar hukum lainnya.</li>
            <li><strong>Sopan Santun:</strong> Harap menjaga etika saat menghubungi manager tim lain melalui WhatsApp.</li>
            <li><strong>Pembatalan:</strong> Jika sudah sepakat sparring (Deal), dilarang membatalkan sepihak tanpa alasan yang jelas (Ghosting).</li>
          </ul>

          <p className="bg-yellow-50 p-4 rounded-lg text-sm border border-yellow-200 mt-4">
            <strong>Disclaimer:</strong> Kami hanya penyedia platform pertemuan. Segala transaksi keuangan atau kejadian di lapangan adalah tanggung jawab masing-masing tim.
          </p>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100">
            <Link href="/" className="text-blue-600 font-bold hover:underline">&larr; Kembali ke Beranda</Link>
        </div>
      </div>
    </div>
  )
}