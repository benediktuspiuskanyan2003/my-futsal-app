// src/app/dashboard/my-requests/page.jsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MyRequestsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending') // pending, accepted, rejected
  const [requests, setRequests] = useState([])
  const [notification, setNotification] = useState(null)
  const [cancelingId, setCancelingId] = useState(null)
  const [respondingId, setRespondingId] = useState(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      setUser(authUser)

      // Fetch user's team
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('manager_id', authUser.id)
        .single()

      if (teamData) {
        setTeam(teamData)
        fetchMyRequests(teamData.id)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    }
  }

  const fetchMyRequests = async (teamId) => {
    try {
      setLoading(true)

      // 1. Fetch all match requests SENT by this team
      const { data: sentRequests, error: sentError } = await supabase
        .from('match_requests')
        .select('id, match_id, status, created_at, responded_at')
        .eq('requesting_team_id', teamId)
        .order('created_at', { ascending: false })

      if (sentError) {
        console.error('Error fetching sent requests:', sentError)
        throw sentError
      }

      // 2. Fetch all matches created by this team
      const { data: myMatches, error: matchesError } = await supabase
        .from('matches')
        .select('id, play_date, play_time, location_name, team_id')
        .eq('team_id', teamId)

      if (matchesError) {
        console.error('Error fetching matches:', matchesError)
        throw matchesError
      }

      // 3. Fetch match requests RECEIVED (requests for matches created by this team)
      const myMatchIds = (myMatches || []).map(m => m.id)
      let receivedRequests = []
      
      if (myMatchIds.length > 0) {
        const { data: received, error: receivedError } = await supabase
          .from('match_requests')
          .select('id, match_id, requesting_team_id, status, created_at, responded_at')
          .in('match_id', myMatchIds)

        if (receivedError) {
          console.error('Error fetching received requests:', receivedError)
          throw receivedError
        }
        receivedRequests = received || []
      }

      // 4. Enrich SENT requests
      const enrichedSentRequests = await Promise.all(
        (sentRequests || []).map(async (req) => {
          const matchData = myMatches?.find(m => m.id === req.match_id)
          
          const { data: hostTeam } = await supabase
            .from('teams')
            .select('id, name, city, logo_url, skill_level, is_verified')
            .eq('id', matchData?.team_id)
            .single()
            .catch(e => ({ data: null }))

          return {
            ...req,
            type: 'outgoing',
            match: matchData,
            otherTeam: hostTeam
          }
        })
      )

      // 5. Enrich RECEIVED requests
      const enrichedReceivedRequests = await Promise.all(
        (receivedRequests || []).map(async (req) => {
          const matchData = myMatches?.find(m => m.id === req.match_id)
          
          const { data: requestingTeam } = await supabase
            .from('teams')
            .select('id, name, city, logo_url, skill_level, is_verified')
            .eq('id', req.requesting_team_id)
            .single()
            .catch(e => ({ data: null }))

          return {
            ...req,
            type: 'incoming',
            match: matchData,
            otherTeam: requestingTeam
          }
        })
      )

      // 6. Combine and sort by date
      const allRequests = [...enrichedSentRequests, ...enrichedReceivedRequests]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setRequests(allRequests)
    } catch (error) {
      console.error('Error fetching requests:', error?.message || JSON.stringify(error))
      showNotification('error', 'Gagal memuat permintaan')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (requestId) => {
    try {
      setCancelingId(requestId)

      const { error } = await supabase
        .from('match_requests')
        .delete()
        .eq('id', requestId)

      if (error) throw error

      showNotification('success', 'Permintaan dibatalkan')
      fetchMyRequests(team.id)
    } catch (error) {
      console.error('Error canceling request:', error)
      showNotification('error', 'Gagal membatalkan permintaan')
    } finally {
      setCancelingId(null)
    }
  }

  const handleRespond = async (requestId, action) => {
    try {
      setRespondingId(requestId)

      const { error } = await supabase
        .from('match_requests')
        .update({
          status: action, // 'accepted' or 'rejected'
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

      const actionLabel = action === 'accepted' ? 'diterima' : 'ditolak'
      showNotification('success', `Permintaan ${actionLabel}`)
      fetchMyRequests(team.id)
    } catch (error) {
      console.error('Error responding to request:', error)
      showNotification('error', 'Gagal merespons permintaan')
    } finally {
      setRespondingId(null)
    }
  }

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const filteredRequests = requests.filter(req => req.status === activeTab)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-20">
        <div className="max-w-2xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-300 rounded-lg mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-20 pb-20">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block">
            ← Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">💬 Permintaan</h1>
          <p className="text-gray-600 mt-2">Kelola semua permintaan masuk dan keluar dalam satu tempat</p>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-lg text-white ${
              notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-300">
          {[
            { id: 'pending', label: 'Menunggu', count: requests.filter(r => r.status === 'pending').length },
            { id: 'accepted', label: 'Diterima', count: requests.filter(r => r.status === 'accepted').length },
            { id: 'rejected', label: 'Ditolak', count: requests.filter(r => r.status === 'rejected').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💭</div>
            <p className="text-gray-600 text-lg">
              {activeTab === 'pending'
                ? 'Belum ada permintaan yang menunggu'
                : activeTab === 'accepted'
                ? 'Belum ada yang diterima'
                : 'Belum ada yang ditolak'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all ${
                  request.status === 'pending' ? 'border-l-4 border-l-yellow-400' : ''
                }`}
              >
                {/* Request Card Header - Like Instagram/WhatsApp message */}
                <div className="flex items-start justify-between gap-3">
                  {/* Team Avatar & Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Direction Indicator */}
                    <div className="flex-shrink-0 pt-1">
                      {request.type === 'incoming' ? (
                        <div className="text-2xl">📥</div>
                      ) : (
                        <div className="text-2xl">📤</div>
                      )}
                    </div>

                    {/* Team Logo */}
                    <div className="flex-shrink-0">
                      {request.otherTeam?.logo_url ? (
                        <img
                          src={request.otherTeam.logo_url}
                          alt={request.otherTeam.name}
                          loading="lazy"
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-xl">⚽</span>
                        </div>
                      )}
                    </div>

                    {/* Team & Message Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {request.otherTeam?.name || 'Tim Tidak Ditemukan'}
                        </h3>
                        {request.otherTeam?.is_verified && (
                          <span className="text-blue-600 text-sm flex-shrink-0">✓</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {request.type === 'incoming' ? 'Permintaan masuk' : 'Permintaan keluar'} · {request.otherTeam?.city}
                      </p>
                      <p className="text-sm text-gray-700 mt-1 line-clamp-1">
                        📅 {request.match?.play_date ? new Date(request.match.play_date).toLocaleDateString('id-ID') : '-'} · 📍 {request.match?.location_name || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : request.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {request.status === 'pending'
                        ? '⏳ Menunggu'
                        : request.status === 'accepted'
                        ? '✓ Diterima'
                        : '✕ Ditolak'}
                    </span>
                  </div>
                </div>

                {/* Actions - Show based on type and status */}
                <div className="mt-3 flex gap-2">
                  {/* OUTGOING REQUEST - Sent by this team */}
                  {request.type === 'outgoing' && request.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(request.id)}
                      disabled={cancelingId === request.id}
                      className="flex-1 bg-red-50 hover:bg-red-100 disabled:bg-gray-100 text-red-700 hover:text-red-900 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                    >
                      {cancelingId === request.id ? '⏳ Batalkan...' : 'Batalkan'}
                    </button>
                  )}

                  {/* INCOMING REQUEST - Received by this team */}
                  {request.type === 'incoming' && request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleRespond(request.id, 'accepted')}
                        disabled={respondingId === request.id}
                        className="flex-1 bg-green-50 hover:bg-green-100 disabled:bg-gray-100 text-green-700 hover:text-green-900 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                      >
                        {respondingId === request.id ? '⏳ Terima...' : '✓ Terima'}
                      </button>
                      <button
                        onClick={() => handleRespond(request.id, 'rejected')}
                        disabled={respondingId === request.id}
                        className="flex-1 bg-red-50 hover:bg-red-100 disabled:bg-gray-100 text-red-700 hover:text-red-900 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                      >
                        {respondingId === request.id ? '⏳ Tolak...' : '✕ Tolak'}
                      </button>
                    </>
                  )}

                  {/* View Match Button - Always available */}
                  <Link
                    href={`/matches/${request.match_id}`}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 text-sm font-medium py-2 px-3 rounded-lg transition-colors text-center"
                  >
                    Lihat →
                  </Link>
                </div>

                {/* Response Time */}
                {(request.status === 'accepted' || request.status === 'rejected') && request.responded_at && (
                  <p className="text-xs text-gray-500 mt-2">
                    Direspons pada {new Date(request.responded_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
