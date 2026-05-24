// src/app/dashboard/match-requests/page.jsx
'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MatchRequestsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState([])
  const [notification, setNotification] = useState(null)
  const subscriptionRef = useRef(null)

  useEffect(() => {
    checkAuth()

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
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

      // Fetch user's team
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('manager_id', authUser.id)
        .single()

      if (teamData) {
        setTeam(teamData)
        fetchConversations(teamData.id)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      setLoading(false)
    }
  }

  const fetchConversations = async (teamId) => {
    try {
      setLoading(true)

      // Fetch conversations where this team is involved
      const { data: convs, error: convsError } = await supabase
        .from('conversations')
        .select('*')
        .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
        .order('created_at', { ascending: false })

      if (convsError) throw convsError

      // Fetch opponent team details, match info, dan latest message untuk setiap conversation
      const enrichedConvs = await Promise.all(
        (convs || []).map(async (conv) => {
          const opponentTeamId = conv.team_a_id === teamId ? conv.team_b_id : conv.team_a_id
          
          // Fetch opponent team
          const { data: oppTeam } = await supabase
            .from('teams')
            .select('id, name, city, logo_url, skill_level')
            .eq('id', opponentTeamId)
            .single()

          // Fetch match
          const { data: match } = await supabase
            .from('matches')
            .select('id, play_date, play_time, location_name')
            .eq('id', conv.match_id)
            .single()

          // Fetch latest message
          const { data: latestMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          return {
            ...conv,
            opponentTeam: oppTeam,
            matches: match,
            latestMessage: latestMessage || null
          }
        })
      )

      setConversations(enrichedConvs)

      // Setup real-time listener untuk conversation updates (status changes)
      if (enrichedConvs.length > 0) {
        setupRealtimeListener(teamId, enrichedConvs)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error?.message || error)
      setNotification({
        type: 'error',
        message: 'Gagal memuat percakapan'
      })
    } finally {
      setLoading(false)
    }
  }

  // --- SETUP REAL-TIME LISTENER ---
  const setupRealtimeListener = (teamId, currentConvs) => {
    try {
      // Cleanup existing subscription
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }

      // Get all conversation IDs
      const convIds = currentConvs.map(c => c.id)

      // Subscribe to conversation updates (status changes)
      const conversationChannel = supabase
        .channel('conversations-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversations',
            filter: `id=in.(${convIds.join(',')})`
          },
          (payload) => {
            console.log('Conversation updated:', payload.new.id)
            // Update conversation status in state
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === payload.new.id ? { ...conv, status: payload.new.status } : conv
              )
            )
          }
        )
        .subscribe()

      subscriptionRef.current = conversationChannel
    } catch (error) {
      console.error('Error setting up real-time listener:', error)
    }
  }

  // Setup listener for new messages in any conversation
  useEffect(() => {
    if (!team || conversations.length === 0) return

    try {
      const convIds = conversations.map(c => c.id)
      
      const messagesChannel = supabase
        .channel('messages-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=in.(${convIds.join(',')})`
          },
          (payload) => {
            console.log('New message received:', payload.new.id)
            // Update the conversation with new latest message
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === payload.new.conversation_id
                  ? { ...conv, latestMessage: payload.new }
                  : conv
              )
            )
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(messagesChannel)
      }
    } catch (error) {
      console.error('Error setting up messages listener:', error)
    }
  }, [conversations.length])

  const handleOpenChat = (conversationId, matchId) => {
    router.push(`/matches/${matchId}/chat?conversationId=${conversationId}`)
  }

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat & Percakapan</h1>
          <p className="text-gray-600">Kelola semua percakapan match Anda di sini</p>
        </div>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            </div>
            <p className="text-gray-600 mb-4">Belum ada percakapan</p>
            <p className="text-sm text-gray-500 mb-6">Buat match baru atau terima undangan untuk mulai berbicara dengan tim lain</p>
            <Link href="/matches/create" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Buat Match Baru
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition border border-gray-200 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Team Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {conv.opponentTeam?.logo_url ? (
                      <img
                        src={conv.opponentTeam.logo_url}
                        alt={conv.opponentTeam.name}
                        loading="lazy"
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{conv.opponentTeam?.name}</h3>
                      <p className="text-sm text-gray-500 truncate">
                        📅 {conv.matches?.play_date} • ⏰ {conv.matches?.play_time?.slice(0, 5)}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{conv.matches?.location_name}</p>
                      {conv.latestMessage && (
                        <p className="text-xs text-gray-600 truncate mt-1">
                          <span className="font-semibold">Latest:</span> {conv.latestMessage.content}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status & Action */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      conv.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                      conv.status === 'Declined' ? 'bg-red-100 text-red-700' :
                      conv.status === 'Cancelled' ? 'bg-gray-100 text-gray-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {conv.status === 'Confirmed' ? '✅ Confirmed' :
                       conv.status === 'Declined' ? '❌ Declined' :
                       conv.status === 'Cancelled' ? '⚪ Cancelled' :
                       '💬 Open'}
                    </div>

                    <button
                      onClick={() => handleOpenChat(conv.id, conv.match_id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                    >
                      Open Chat
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
