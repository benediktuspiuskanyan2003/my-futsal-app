// src/app/dashboard/jadwal-sparring/page.jsx
'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function JadwalSparringPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmedMatches, setConfirmedMatches] = useState([])
  const [notification, setNotification] = useState(null)
  const subscriptionRef = useRef(null)
  const timerIntervalRef = useRef(null)

  // States untuk filter upcoming vs completed
  const [upcomingMatches, setUpcomingMatches] = useState([])
  const [completedMatches, setCompletedMatches] = useState([])
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    checkAuth()

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      setUser(authUser)

      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('manager_id', authUser.id)
        .single()

      if (teamData) {
        setTeam(teamData)
        fetchConfirmedMatches(teamData.id)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      setLoading(false)
    }
  }

  const fetchConfirmedMatches = async (teamId) => {
    try {
      setLoading(true)

      // Fetch conversations dengan status Confirmed
      const { data: convs, error: convsError } = await supabase
        .from('conversations')
        .select('*')
        .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
        .eq('status', 'Confirmed')
        .order('created_at', { ascending: false })

      if (convsError) throw convsError

      // Enrich dengan match details dan opponent team
      const enrichedMatches = await Promise.all(
        (convs || []).map(async (conv) => {
          const opponentTeamId = conv.team_a_id === teamId ? conv.team_b_id : conv.team_a_id

          // Fetch opponent team
          const { data: oppTeam } = await supabase
            .from('teams')
            .select('id, name, city, logo_url, skill_level')
            .eq('id', opponentTeamId)
            .single()

          // Fetch match details
          const { data: match } = await supabase
            .from('matches')
            .select('*')
            .eq('id', conv.match_id)
            .single()

          return {
            conversationId: conv.id,
            match,
            opponentTeam: oppTeam,
            isHost: conv.team_a_id === teamId
          }
        })
      )

      // Sort by play_date ascending (upcoming first)
      const sorted = enrichedMatches.sort(
        (a, b) => new Date(a.match.play_date) - new Date(b.match.play_date)
      )

      // Pisahkan upcoming vs completed
      const now = new Date()
      const upcoming = []
      const completed = []

      sorted.forEach((item) => {
        try {
          // Parse date dengan robust - bisa handle berbagai format
          const playDateStr = item.match.play_date // Bisa "2026-05-24" atau "24/5/2026"
          const playTimeStr = item.match.play_time // "23:00"
          
          // Ensure format ISO (YYYY-MM-DD)
          let formattedDate = playDateStr
          if (playDateStr.includes('/')) {
            // Jika format DD/MM/YYYY atau DD-MM-YYYY, convert ke YYYY-MM-DD
            const parts = playDateStr.split(/[-\/]/)
            if (parts.length === 3) {
              if (parts[2].length === 4) {
                // Format DD/MM/YYYY
                formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
              }
            }
          }
          
          const matchDateTime = new Date(`${formattedDate}T${playTimeStr}`)
          
          // Jika parsing gagal, skip
          if (isNaN(matchDateTime.getTime())) {
            console.warn('Invalid date parsed:', playDateStr, playTimeStr)
            return
          }

          const twoHoursAfter = new Date(matchDateTime.getTime() + 2 * 60 * 60 * 1000)

          if (now < matchDateTime) {
            // Match belum dimulai
            upcoming.push(item)
          } else if (now > twoHoursAfter) {
            // Match sudah selesai (2 jam setelah start time)
            completed.push(item)
          } else {
            // Match sedang berlangsung (between start time dan 2 hours after)
            upcoming.push(item)
          }
        } catch (error) {
          console.error('Error filtering match:', error, item)
        }
      })

      console.log(`Jadwal Sparring - Total: ${sorted.length}, Upcoming: ${upcoming.length}, Completed: ${completed.length}`)

      setConfirmedMatches(sorted)
      setUpcomingMatches(upcoming)
      setCompletedMatches(completed)

      // Setup real-time listener
      setupRealtimeListener(teamId)

      // Start countdown timer
      startCountdownTimer()
    } catch (error) {
      console.error('Error fetching confirmed matches:', error?.message || error)
      setNotification({
        type: 'error',
        message: 'Gagal memuat jadwal sparring'
      })
    } finally {
      setLoading(false)
    }
  }

  // --- SETUP REAL-TIME LISTENER ---
  const setupRealtimeListener = (teamId) => {
    try {
      const conversationChannel = supabase
        .channel('confirmed-matches-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations'
          },
          () => {
            // Refresh matches when any conversation changes
            fetchConfirmedMatches(teamId)
          }
        )
        .subscribe()

      subscriptionRef.current = conversationChannel
    } catch (error) {
      console.error('Error setting up real-time listener:', error)
    }
  }

  // --- COUNTDOWN TIMER ---
  const startCountdownTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }

    timerIntervalRef.current = setInterval(() => {
      setConfirmedMatches((prev) => [...prev])
    }, 60000) // Update setiap menit
  }

  const calculateCountdown = (matchDate, matchTime) => {
    try {
      // Parse date dengan robust
      let formattedDate = matchDate
      if (matchDate.includes('/')) {
        const parts = matchDate.split(/[-\/]/)
        if (parts.length === 3 && parts[2].length === 4) {
          // Format DD/MM/YYYY
          formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
        }
      }

      const matchDateTime = new Date(`${formattedDate}T${matchTime}`)
      const now = new Date()
      const diff = matchDateTime - now

      if (isNaN(matchDateTime.getTime())) {
        return 'Invalid date'
      }

      if (diff <= 0) {
        // Match sudah dimulai
        const twoHoursAfter = new Date(matchDateTime.getTime() + 2 * 60 * 60 * 1000)
        if (now < twoHoursAfter) {
          return 'ONGOING' // Sedang berlangsung
        } else {
          return 'COMPLETED' // Sudah selesai
        }
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      // Format: "2d 23h 52m" atau "23h 52m" atau "52m"
      if (days > 0) return `${days}d ${hours}h ${minutes}m`
      if (hours > 0) return `${hours}h ${minutes}m`
      return `${minutes}m`
    } catch (error) {
      console.error('Error calculating countdown:', error)
      return 'Error'
    }
  }

  const handleOpenChat = (conversationId, matchId) => {
    router.push(`/matches/${matchId}/chat?conversationId=${conversationId}`)
  }

  const handleOpenRating = (matchId, opponentTeamId) => {
    router.push(`/matches/${matchId}?rateTeam=${opponentTeamId}`)
  }

  const handleViewDetails = (matchId) => {
    router.push(`/matches/${matchId}`)
  }

  const handleShareWhatsApp = (item) => {
    // Format pesan untuk dibagikan
    const message = `🏆 Jadwal Sparring Futsal\n\n📅 ${new Date(item.match.play_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n⏰ ${item.match.play_time} WIB\n📍 ${item.match.location_name}\n👥 vs ${item.opponentTeam?.name}\n\n✅ Status: Dikonfirmasi`

    // Encode message untuk URL
    const encodedMessage = encodeURIComponent(message)

    // Buka WhatsApp dengan pesan (akan redirect ke WhatsApp)
    // Untuk web: https://web.whatsapp.com/send?text=...
    // Untuk mobile: https://api.whatsapp.com/send?text=...
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Anda belum membuat tim</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
          notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📅 Jadwal Sparring</h1>
          <p className="text-gray-600">Daftar pertandingan yang sudah dikonfirmasi</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              activeTab === 'upcoming'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            📅 Upcoming ({upcomingMatches.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              activeTab === 'completed'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            ✅ Riwayat ({completedMatches.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'upcoming' ? (
          // === UPCOMING MATCHES ===
          upcomingMatches.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <p className="text-gray-600 mb-4">Belum ada jadwal sparring yang akan datang</p>
              <p className="text-sm text-gray-500 mb-6">Konfirmasi pertandingan di halaman "Chat & Percakapan" untuk melihatnya di sini</p>
              <Link href="/dashboard/match-requests" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Lihat Chat & Percakapan
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingMatches.map((item) => {
                const countdown = calculateCountdown(item.match.play_date, item.match.play_time)
                const isOngoing = countdown === 'ONGOING'

                return (
                  <div
                    key={item.conversationId}
                    className={`rounded-lg shadow hover:shadow-lg transition border-l-4 ${
                      isOngoing ? 'border-l-red-500 bg-red-50' : 'border-l-blue-500 bg-blue-50'
                    } p-5 bg-white`}
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      {/* Left: Team & Match Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {item.opponentTeam?.logo_url ? (
                          <img
                            src={item.opponentTeam.logo_url}
                            alt={item.opponentTeam.name}
                            loading="lazy"
                            width={56}
                            height={56}
                            className="w-14 h-14 rounded-full object-cover shrink-0 border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center shrink-0 border-2 border-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900">{item.opponentTeam?.name}</h3>
                            {item.opponentTeam?.skill_level && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {item.opponentTeam.skill_level}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            📅 {new Date(item.match.play_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                          <p className="text-sm text-gray-600">
                            ⏰ {item.match.play_time} WIB
                          </p>
                          <p className="text-sm text-gray-600">
                            📍 {item.match.location_name}
                          </p>
                        </div>
                      </div>

                      {/* Middle: Countdown or Status */}
                      <div className="text-center">
                        {isOngoing ? (
                          <div className="text-2xl font-bold text-red-600 animate-pulse">
                            🔴 ONGOING
                          </div>
                        ) : (
                          <>
                            <div className="text-2xl font-bold text-blue-600">
                              {countdown}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Waktu Tersisa</p>
                          </>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleShareWhatsApp(item)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm font-semibold"
                          title="Bagikan ke WhatsApp"
                        >
                          Bagikan
                        </button>
                        <button
                          onClick={() => handleViewDetails(item.match.id)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-semibold"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => handleOpenChat(item.conversationId, item.match.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                        >
                          Chat
                        </button>
                      </div>
                    </div>

                    {/* Host Badge */}
                    {item.isHost && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">
                          🏠 Anda adalah Tuan Rumah
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        ) : (
          // === COMPLETED MATCHES / RIWAYAT ===
          completedMatches.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <p className="text-gray-600 mb-4">Belum ada riwayat match yang selesai</p>
              <p className="text-sm text-gray-500">Riwayat match akan muncul di sini setelah selesai dimainkan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedMatches.map((item) => {
                return (
                  <div
                    key={item.conversationId}
                    className="rounded-lg shadow hover:shadow-lg transition border-l-4 border-l-green-500 bg-green-50 p-5 bg-white"
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      {/* Left: Team & Match Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {item.opponentTeam?.logo_url ? (
                          <img
                            src={item.opponentTeam.logo_url}
                            alt={item.opponentTeam.name}
                            loading="lazy"
                            width={56}
                            height={56}
                            className="w-14 h-14 rounded-full object-cover shrink-0 border-2 border-gray-200 grayscale"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center shrink-0 border-2 border-gray-200 grayscale">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900">{item.opponentTeam?.name}</h3>
                            {item.opponentTeam?.skill_level && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {item.opponentTeam.skill_level}
                              </span>
                            )}
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">✅ Selesai</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            📅 {new Date(item.match.play_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                          <p className="text-sm text-gray-600">
                            ⏰ {item.match.play_time} WIB
                          </p>
                          <p className="text-sm text-gray-600">
                            📍 {item.match.location_name}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleOpenRating(item.match.id, item.opponentTeam?.id)}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition text-sm font-semibold"
                          title="Beri Rating"
                        >
                          ⭐ Rating
                        </button>
                        <button
                          onClick={() => handleViewDetails(item.match.id)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-semibold"
                        >
                          Detail
                        </button>
                      </div>
                    </div>

                    {/* Host Badge */}
                    {item.isHost && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">
                          🏠 Anda adalah Tuan Rumah
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <Link href="/dashboard/match-requests" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            Chat & Percakapan
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
