// src/components/MatchCard.jsx
import Link from 'next/link';

export default function MatchCard({ match }) {
  // Kita ambil data tim dari relasi (joined data)
  const team = match.teams; 

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
      {/* Header: Waktu & Tanggal */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
          {match.play_time.slice(0, 5)} WIB
        </span>
        <span className="text-xs text-gray-500">
          {match.play_date}
        </span>
      </div>

      {/* Info Tim (YANG SUDAH DI-UPDATE SUPAYA BISA DIKLIK) */}
      {/* Kita bungkus info tim dengan Link ke halaman profil publik */}
      <Link href={`/teams/${match.team_id}`} className="group">
        <div className="flex items-center gap-3 mb-4 p-2 -ml-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">
            {/* Avatar Tim */}
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border border-gray-100 group-hover:border-blue-300 transition">
                {team?.logo_url ? (
                    <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover"/>
                ) : (
                    <span className="text-lg">⚽</span>
                )}
            </div>
            <div>
                <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition">
                    {team?.name || "Nama Tim"}
                </h3>
                <p className="text-xs text-gray-500">{team?.city || "Kota"}</p>
            </div>
        </div>
      </Link>

      {/* Detail Lapangan, Skill & Status */}
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        
        {/* Badge Skill Level */}
        <div className="flex items-center gap-2">
            <span>⚡</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                team?.skill_level === 'Pro' ? 'bg-purple-100 text-purple-700' : 
                team?.skill_level === 'Intermediate' ? 'bg-blue-100 text-blue-700' : 
                'bg-yellow-100 text-yellow-700' // Default Fun
            }`}>
                Level: {team?.skill_level || 'Fun'}
            </span>
        </div>

        {/* Lokasi */}
        <div className="flex items-center gap-2">
          <span>📍</span>
          <span className="truncate">{match.location_name}</span>
        </div>

        {/* Status Booking */}
        <div className="flex items-center gap-2">
           {match.is_venue_booked ? (
               <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                 ✅ Lapangan Ready
               </span>
           ) : (
               <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                 ⚠️ Cari Bareng
               </span>
           )}
        </div>
      </div>

      {/* Tombol Aksi */}
      <Link href={`/matches/${match.id}`} className="block text-center w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition">
        Lihat Detail
      </Link>
    </div>
  );
}