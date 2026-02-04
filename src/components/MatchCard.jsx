// src/components/MatchCard.jsx
import Link from 'next/link';

export default function MatchCard({ match }) {
  const team = match.teams;

  return (
    <div className="group bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full relative">

      {/* BAGIAN ATAS: HEADER & TIM */}
      {/* PADDING: Dikurangi jadi p-4 di mobile, p-5 di desktop */}
      <div className="p-4 md:p-5 flex-1">

        {/* Header: Tanggal & Waktu */}
        <div className="flex justify-between items-start mb-3 md:mb-4">
            <div className="flex items-center gap-1.5 text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                {/* Icon Calendar */}
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-[14px] md:h-[14px]"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                {match.play_date}
            </div>
            <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg text-[10px] md:text-xs font-bold">
                {/* Icon Clock */}
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="md:w-[12px] md:h-[12px]"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                {match.play_time.slice(0, 5)} WIB
            </div>
        </div>

        {/* Info Tim (Clickable) */}
        <Link href={`/teams/${match.team_id}`}>
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-5 group-hover:bg-gray-50 p-1.5 md:p-2 -ml-1.5 md:-ml-2 rounded-xl transition cursor-pointer">
                {/* Avatar Tim: Ukuran dikecilkan sedikit di mobile */}
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
                    {team?.logo_url ? (
                        <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover"/>
                    ) : (
                        // Icon Shield (Pengganti Bola Emoji)
                        <svg className="text-gray-400 w-5 h-5 md:w-6 md:h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                    )}
                </div>
                <div className="min-w-0">
                    <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Host Team</p>
                    {/* FONT SIZE: text-base di mobile, text-lg di desktop */}
                    <h3 className="font-bold text-gray-900 text-base md:text-lg leading-tight truncate group-hover:text-blue-600 transition">
                        {team?.name || "Nama Tim"}
                    </h3>
                    <p className="text-[10px] md:text-xs text-gray-500 truncate">{team?.city || "Kota"}</p>
                </div>
            </div>
        </Link>

        {/* Separator Garis Putus-putus (Ticket Style) */}
        <div className="border-t border-dashed border-gray-200 my-3 md:my-4"></div>

        {/* Detail Info Grid */}
        <div className="space-y-2 md:space-y-3">

            {/* 1. Lokasi */}
            <div className="flex items-start gap-2 md:gap-2.5">
                <div className="mt-0.5 text-gray-400">
                    {/* Icon Map Pin */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-[14px] md:h-[14px]"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-600 line-clamp-1">
                    {match.location_name}
                </span>
            </div>

            {/* 2. Skill Level */}
            <div className="flex items-center gap-2 md:gap-2.5">
                <div className={`mt-0.5 ${
                    team?.skill_level === 'Pro' ? 'text-purple-500' :
                    team?.skill_level === 'Intermediate' ? 'text-blue-500' :
                    'text-yellow-500'
                }`}>
                    {/* Icon Lightning */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="md:w-[14px] md:h-[14px]"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-600">
                    Level: {team?.skill_level || 'Fun'}
                </span>
            </div>

            {/* 3. Status Booking */}
            <div className="flex items-center gap-2 md:gap-2.5">
                <div className="mt-0.5">
                    {match.is_venue_booked ? (
                        // Icon Check Circle (Green)
                        <svg className="text-green-500 md:w-[14px] md:h-[14px]" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    ) : (
                        // Icon Alert Circle (Orange)
                        <svg className="text-orange-500 md:w-[14px] md:h-[14px]" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    )}
                </div>
                <span className={`text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 rounded-md ${
                    match.is_venue_booked ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                }`}>
                    {match.is_venue_booked ? 'Lapangan Ready' : 'Cari Bareng / Belum Booking'}
                </span>
            </div>

        </div>
      </div>

      {/* FOOTER KARTU: TOMBOL */}
      <div className="p-3 md:p-4 bg-gray-50 border-t border-gray-100 mt-auto">
        <Link href={`/matches/${match.id}`} className="flex items-center justify-center gap-2 w-full bg-white border border-gray-200 hover:border-black hover:bg-black hover:text-white text-gray-900 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all shadow-sm">
            Lihat Detail

            {/* Icon Arrow Right */}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-[16px] md:h-[16px]"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </Link>
      </div>

    </div>
  );
}