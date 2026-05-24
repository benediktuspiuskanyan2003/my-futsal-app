// src/app/matches/[id]/chat/page.jsx
'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import clientLogger from '../../../../lib/clientLogger'
import Link from 'next/link'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const matchId = params.id
  const conversationIdFromUrl = searchParams.get('conversationId')
  
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [myTeam, setMyTeam] = useState(null)
  
  const [conversation, setConversation] = useState(null)
  const [opponentTeam, setOpponentTeam] = useState(null)
  const [match, setMatch] = useState(null)
  
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [notification, setNotification] = useState(null)
  
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)
  const subscriptionRef = useRef(null)
  const pollingIntervalRef = useRef(null)

  // --- CHECK IF USER IS AT BOTTOM OF CHAT ---
  const isUserAtBottom = () => {
    if (!chatContainerRef.current) return false
    const { scrollHeight, scrollTop, clientHeight } = chatContainerRef.current
    // Consider user "at bottom" if within 50px of bottom
    return scrollHeight - scrollTop - clientHeight < 50
  }

  // --- SCROLL KE PESAN TERBARU (SMART AUTO-SCROLL) ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    // Only auto-scroll if user is already at bottom
    if (isUserAtBottom()) {
      scrollToBottom()
    }
  }, [messages])

  // --- INIT: CEK USER & LOAD DATA ---
  useEffect(() => {
    const initialize = async () => {
      try {
        // 1. Cek user login
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) {
          clientLogger.warn('Chat: user not found, redirecting to login', { page: 'chat' })
          return router.push('/login')
        }
        setUser(currentUser)
        clientLogger.info('Chat: user loaded', { userId: currentUser.id, page: 'chat' })

        // 2. Ambil tim user
        const { data: teamData } = await supabase
          .from('teams')
          .select('*')
          .eq('manager_id', currentUser.id)
          .single()

        if (!teamData) {
          setNotification({
            type: 'error',
            message: 'Anda belum membuat tim. Buat tim dulu untuk bisa chat.'
          })
          return
        }
        setMyTeam(teamData)

        // 3. Ambil match detail
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .eq('id', matchId)
          .single()

        if (matchError || !matchData) {
          clientLogger.error('Chat: match not found', { matchId, page: 'chat' })
          return router.push('/')
        }
        setMatch(matchData)

        // 4. Cari conversation
        let convData = null

        // Jika ada conversationId dari URL, gunakan itu
        if (conversationIdFromUrl) {
          const { data: conv, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationIdFromUrl)
            .single()
          
          if (convError) {
            clientLogger.error('Chat: RLS error loading conversation', { error: convError, conversationIdFromUrl })
          }
          convData = conv
        } else {
          // Jika tidak ada di URL, cari semua conversation untuk match ini
          // yang melibatkan myTeam (bukan Team A membuat conversation dengan diri sendiri)
          const { data: convList, error: listError } = await supabase
            .from('conversations')
            .select('*')
            .eq('match_id', matchId)

          if (listError) {
            clientLogger.error('Chat: RLS error loading conversations list', { error: listError, matchId })
          }

          // Filter: ambil conversation yang melibatkan myTeam
          if (convList && convList.length > 0) {
            convData = convList.find(
              (conv) => conv.team_a_id === teamData.id || conv.team_b_id === teamData.id
            )
          }
        }

        // Jika masih tidak ada conversation, itu berarti Team A membuka chat pertama kali
        // Tidak boleh create baru sendiri! Tunggu Team B request dulu
        if (!convData) {
          setNotification({
            type: 'error',
            message: 'Belum ada tim yang menghubungi match ini. Tunggu tim lain untuk menghubungi.'
          })
          setLoading(false)
          return router.push(`/matches/${matchId}`)
        }

        setConversation(convData)

        // 5. Ambil opponent team
        const opponentTeamId = convData.team_a_id === teamData.id ? convData.team_b_id : convData.team_a_id
        const { data: oppTeam } = await supabase
          .from('teams')
          .select('*')
          .eq('id', opponentTeamId)
          .single()

        if (oppTeam) setOpponentTeam(oppTeam)

        // 6. Load chat history
        await loadMessages(convData.id)

        // 7. Setup realtime subscription
        setupRealtimeListener(convData.id)

        clientLogger.info('Chat: initialized', { matchId, conversationId: convData.id, page: 'chat' })
      } catch (error) {
        clientLogger.error('Chat: initialization failed', { error: error.message, page: 'chat' })
        setNotification({
          type: 'error',
          message: 'Gagal memuat chat. Coba refresh halaman.'
        })
      } finally {
        setLoading(false)
      }
    }

    initialize()

    return () => {
      // Cleanup real-time subscription
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
      // Cleanup polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [matchId])

  // --- LOAD MESSAGE HISTORY ---
  const loadMessages = async (conversationId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      clientLogger.error('Chat: load messages failed', { error: error.message, page: 'chat' })
    }
  }

  // --- SETUP REALTIME LISTENER WITH FALLBACK POLLING ---
  const setupRealtimeListener = (conversationId) => {
    try {
      // 1. Setup real-time subscription
      const channel = supabase
        .channel(`chat-${conversationId}`, {
          config: {
            broadcast: { self: true }
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            clientLogger.debug('Chat: new message received', { messageId: payload.new.id })
            // Cek apakah message sudah ada di local state (untuk avoid duplikasi dari optimistic update)
            setMessages((prev) => {
              const messageExists = prev.some((msg) => msg.id === payload.new.id)
              if (messageExists) {
                clientLogger.debug('Chat: message already exists, skipping', { messageId: payload.new.id })
                return prev // Skip, message sudah ada
              }
              return [...prev, payload.new]
            })
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clientLogger.info('Chat: realtime listener subscribed', { conversationId })
          } else if (status === 'CHANNEL_ERROR') {
            clientLogger.warn('Chat: realtime channel error, using polling fallback', { conversationId })
          }
        })

      subscriptionRef.current = channel

      // 2. Setup polling fallback (check every 3 seconds)
      // This ensures messages are loaded even if real-time fails
      const pollMessages = async () => {
        try {
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })

          if (error) throw error

          setMessages((prevMessages) => {
            if (!data || data.length === prevMessages.length) {
              return prevMessages
            }

            // Check if there are new messages
            const newMessages = data.filter(
              (msg) => !prevMessages.some((prev) => prev.id === msg.id)
            )

            if (newMessages.length > 0) {
              clientLogger.info('Chat: polling found new messages', { count: newMessages.length })
              return data
            }

            return prevMessages
          })
        } catch (error) {
          clientLogger.error('Chat: polling failed', { error: error.message })
        }
      }

      // Start polling
      pollingIntervalRef.current = setInterval(pollMessages, 3000)
    } catch (error) {
      clientLogger.error('Chat: realtime setup failed', { error: error.message, page: 'chat' })
    }
  }

  // --- SEND MESSAGE ---
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageInput.trim() || !conversation || !myTeam) return

    const messageContent = messageInput.trim()
    
    try {
      setSending(true)
      
      // 1. OPTIMISTIC UPDATE: Langsung tampilkan pesan di UI sebelum server confirm
      const optimisticMessage = {
        id: `temp-${Date.now()}`, // Temporary ID
        conversation_id: conversation.id,
        sender_team_id: myTeam.id,
        content: messageContent,
        created_at: new Date().toISOString()
      }
      setMessages((prev) => [...prev, optimisticMessage])
      setMessageInput('')
      
      // 2. INSERT ke database
      const { data: insertedMessage, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_team_id: myTeam.id,
          content: messageContent
        })
        .select()
        .single()

      if (error) throw error

      // 3. Replace optimistic message dengan real message dari server
      setMessages((prev) => 
        prev.map((msg) => msg.id === optimisticMessage.id ? insertedMessage : msg)
      )

      clientLogger.info('Chat: message sent', { conversationId: conversation.id, page: 'chat' })
    } catch (error) {
      // 4. Jika error, hapus optimistic message
      setMessages((prev) => 
        prev.filter((msg) => msg.id !== `temp-${Date.now()}`)
      )
      
      clientLogger.error('Chat: send message failed', { error: error.message, page: 'chat' })
      setNotification({
        type: 'error',
        message: 'Gagal mengirim pesan'
      })
    } finally {
      setSending(false)
    }
  }

  // --- CONFIRM MATCH ---
  const handleConfirmMatch = async () => {
    if (!conversation || !match || !myTeam) return

    // 🔐 PERMISSION CHECK: Hanya team_a (tuan rumah) yang bisa confirm
    if (conversation.team_a_id !== myTeam.id) {
      setNotification({
        type: 'error',
        message: 'Hanya tuan rumah yang bisa confirm pertandingan'
      })
      clientLogger.warn('Chat: unauthorized confirm attempt', { userId: user.id, teamId: myTeam.id, page: 'chat' })
      return
    }

    try {
      // 1. Update conversation status ke Confirmed
      const { error: convError } = await supabase
        .from('conversations')
        .update({ status: 'Confirmed' })
        .eq('id', conversation.id)

      if (convError) throw convError

      // 2. Auto-cancel semua conversations lain untuk match yang sama
      const { error: cancelError } = await supabase
        .from('conversations')
        .update({ status: 'Cancelled' })
        .eq('match_id', matchId)
        .neq('id', conversation.id)

      if (cancelError) throw cancelError

      // 3. Update match status
      const { error: matchError } = await supabase
        .from('matches')
        .update({ 
          status: 'Confirmed',
          conversation_id: conversation.id 
        })
        .eq('id', matchId)

      if (matchError) throw matchError

      setConversation({ ...conversation, status: 'Confirmed' })
      setNotification({
        type: 'success',
        message: 'Match confirmed! Tim lainnya otomatis di-cancel. ✅'
      })
      clientLogger.info('Chat: match confirmed & other conversations cancelled', { matchId, conversationId: conversation.id, page: 'chat' })
    } catch (error) {
      clientLogger.error('Chat: confirm match failed', { error: error.message, page: 'chat' })
      setNotification({
        type: 'error',
        message: 'Gagal confirm match'
      })
    }
  }

  // --- DECLINE MATCH ---
  const handleDeclineMatch = async () => {
    if (!conversation || !myTeam) return

    // 🔐 PERMISSION CHECK: Hanya team_a (host) yang bisa decline
    if (conversation.team_a_id !== myTeam.id) {
      setNotification({
        type: 'error',
        message: 'Hanya tuan rumah yang bisa decline pertandingan'
      })
      clientLogger.warn('Chat: unauthorized decline attempt', { userId: user.id, teamId: myTeam.id, page: 'chat' })
      return
    }

    try {
      // Update conversation status ke Declined
      const { error: convError } = await supabase
        .from('conversations')
        .update({ status: 'Declined' })
        .eq('id', conversation.id)

      if (convError) throw convError

      setConversation({ ...conversation, status: 'Declined' })
      setNotification({
        type: 'info',
        message: 'Anda telah menolak pertandingan ini.'
      })
      clientLogger.info('Chat: match declined', { conversationId: conversation.id, page: 'chat' })
    } catch (error) {
      clientLogger.error('Chat: decline match failed', { error: error.message, page: 'chat' })
      setNotification({
        type: 'error',
        message: 'Gagal decline match'
      })
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 pt-16 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </main>
    )
  }

  if (!conversation || !myTeam || !opponentTeam) {
    return (
      <main className="min-h-screen bg-gray-50 pt-16 pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Chat tidak tersedia</p>
          <Link href={`/matches/${matchId}`} className="text-blue-600 hover:underline">
            Kembali ke Match
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-16 pb-20 md:pb-0 flex flex-col md:flex-row">
      
      {/* --- NOTIFICATION TOAST --- */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
          notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`}>
          {notification.message}
        </div>
      )}

      {/* --- CHAT CONTAINER --- */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        
        {/* --- HEADER --- */}
        <div className="bg-white border-b border-gray-200 p-4 md:p-5 sticky top-16 md:top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href={`/matches/${matchId}`}
                className="text-gray-600 hover:text-gray-900 md:hidden"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </Link>
              
              <div className="flex-1">
                <h2 className="font-bold text-gray-900">{opponentTeam.name}</h2>
                <p className="text-xs text-gray-500">
                  {match?.play_date} • {match?.play_time} WIB
                </p>
              </div>
            </div>

            {conversation.status === 'Open' && conversation.team_a_id === myTeam?.id && (
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmMatch}
                  className="px-3 py-1.5 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition"
                >
                  Confirm
                </button>
                <button
                  onClick={handleDeclineMatch}
                  className="px-3 py-1.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition"
                >
                  Decline
                </button>
              </div>
            )}
            {conversation.status === 'Open' && conversation.team_b_id === myTeam?.id && (
              <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-sm font-semibold rounded-lg">
                ⏳ Menunggu Konfirmasi
              </span>
            )}
            {conversation.status === 'Confirmed' && (
              <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-semibold rounded-lg">
                ✅ Confirmed
              </span>
            )}
            {conversation.status === 'Declined' && (
              <span className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-semibold rounded-lg">
                ❌ Declined
              </span>
            )}
            {conversation.status === 'Cancelled' && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg">
                ⚪ Cancelled
              </span>
            )}
          </div>
        </div>

        {/* --- MESSAGES AREA --- */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <p className="text-gray-500 mb-2">Belum ada pesan</p>
                <p className="text-xs text-gray-400">Mulai percakapan dengan {opponentTeam.name}</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMyMessage = msg.sender_team_id === myTeam.id
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isMyMessage
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      isMyMessage ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(msg.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* --- MESSAGE INPUT --- */}
        <div className="border-t border-gray-200 bg-white p-4 md:p-5">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Ketik pesan..."
              disabled={sending || conversation.status === 'Cancelled' || conversation.status === 'Declined'}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={sending || !messageInput.trim() || conversation.status === 'Cancelled' || conversation.status === 'Declined'}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition font-semibold"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
          {conversation.status === 'Cancelled' && (
            <p className="text-xs text-red-500 mt-2">Chat ditutup (Match sudah dikonfirmasi dengan tim lain)</p>
          )}
          {conversation.status === 'Declined' && (
            <p className="text-xs text-red-500 mt-2">Chat ditutup (Anda telah menolak pertandingan ini)</p>
          )}
        </div>
      </div>

      {/* --- SIDEBAR INFO (DESKTOP) --- */}
      <div className="hidden md:flex md:w-80 bg-white border-l border-gray-200 p-5 flex-col">
        <h3 className="font-bold text-gray-900 mb-4">Match Info</h3>
        
        <div className="space-y-4">
          {/* Match Details */}
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">Tanggal & Waktu</p>
            <p className="text-sm font-semibold text-gray-900">
              {match?.play_date} • {match?.play_time} WIB
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">Lokasi</p>
            <p className="text-sm font-semibold text-gray-900">{match?.location_name}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">Biaya</p>
            <p className="text-sm font-semibold text-gray-900 capitalize">{match?.fee_type}</p>
          </div>

          {match?.description && (
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Catatan</p>
              <p className="text-sm text-gray-700">{match.description}</p>
            </div>
          )}
        </div>

        <hr className="my-4" />

        {/* Opponent Team Info */}
        <div>
          <h4 className="font-bold text-gray-900 mb-3">Tim Lawan</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <img 
                src={opponentTeam.logo_url || 'https://via.placeholder.com/40'} 
                alt={opponentTeam.name}
                className="w-10 h-10 rounded-full bg-gray-100"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">{opponentTeam.name}</p>
                <p className="text-xs text-gray-500">{opponentTeam.city}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
