'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import clientLogger from '../../../lib/clientLogger'
import { CITIES } from '../../../lib/cities'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [notification, setNotification] = useState(null)
  
  // Tab state
  const [activeTab, setActiveTab] = useState('account')
  
  // Password reset state
  const [resetEmail, setResetEmail] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)
  const [resetMessage, setResetMessage] = useState(null)
  const [resetError, setResetError] = useState(null)
  
  // Logout state
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  
  // Activity state
  const [lastLogin, setLastLogin] = useState(null)
  const [lastPasswordChange, setLastPasswordChange] = useState(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      clientLogger.info('Settings: fetching user data', { page: 'settings' })
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        clientLogger.warn('Settings: user not authenticated', { page: 'settings' })
        return router.push('/login')
      }
      
      setUser(user)
      setResetEmail(user.email)
      
      clientLogger.info('Settings: user loaded', { userId: user.id, page: 'settings' })
      
      // Get activity data dari user metadata
      if (user.user_metadata?.last_login) {
        setLastLogin(new Date(user.user_metadata.last_login))
      }
      if (user.user_metadata?.last_password_change) {
        setLastPasswordChange(new Date(user.user_metadata.last_password_change))
      }
      
    } catch (error) {
      clientLogger.error('Settings: fetch failed', { error: error.message, page: 'settings' })
      setNotification({ type: 'error', title: 'Error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setResettingPassword(true)
    setResetMessage(null)
    setResetError(null)

    try {
      clientLogger.info('Settings: password change requested', { email: resetEmail, page: 'settings' })
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) throw error

      clientLogger.info('Settings: password reset email sent', { email: resetEmail, page: 'settings' })
      setResetMessage('Email untuk ganti password telah dikirim. Cek inbox Anda!')
      
    } catch (error) {
      clientLogger.error('Settings: password change failed', { email: resetEmail, error: error.message, page: 'settings' })
      setResetError(error.message)
    } finally {
      setResettingPassword(false)
    }
  }

  const handleLogoutAllDevices = async () => {
    setLogoutLoading(true)
    try {
      clientLogger.info('Settings: logout all devices requested', { userId: user.id, page: 'settings' })
      
      await supabase.auth.signOut({ scope: 'global' })
      
      clientLogger.info('Settings: logged out from all devices', { userId: user.id, page: 'settings' })
      router.push('/login')
      
    } catch (error) {
      clientLogger.error('Settings: logout failed', { error: error.message, page: 'settings' })
      setNotification({ type: 'error', title: 'Error', message: error.message })
    } finally {
      setLogoutLoading(false)
      setShowLogoutModal(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat pengaturan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Pengaturan Akun</h1>
          <p className="text-gray-500 mt-2">Kelola data dan keamanan akun Anda</p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-700 border-green-100' 
              : 'bg-red-50 text-red-700 border-red-100'
          }`}>
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              {notification.type === 'success' ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              )}
            </svg>
            <div>
              <p className="font-bold">{notification.title}</p>
              <p className="text-sm">{notification.message}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'account', label: 'Informasi Akun', icon: '👤' },
              { id: 'security', label: 'Keamanan', icon: '🔒' },
              { id: 'activity', label: 'Aktivitas', icon: '📊' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Terdaftar</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
                    {user?.email}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Email tidak dapat diubah untuk keamanan.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bergabung Sejak</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'N/A'}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Tip:</strong> Pastikan email Anda selalu aktif untuk menerima notifikasi penting dan link verifikasi.
                  </p>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-900">
                    <strong>Keamanan:</strong> Gunakan password yang kuat dan unik. Jangan bagikan password Anda kepada siapa pun.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-4">Ganti Password</h3>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email untuk Verifikasi</label>
                      <input
                        type="email"
                        value={resetEmail}
                        disabled
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                      />
                      <p className="text-xs text-gray-500 mt-2">Link verifikasi akan dikirim ke email ini.</p>
                    </div>

                    {resetMessage && (
                      <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">
                        ✓ {resetMessage}
                      </div>
                    )}

                    {resetError && (
                      <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                        ✗ {resetError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={resettingPassword}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                    >
                      {resettingPassword ? 'Mengirim...' : 'Kirim Link Ganti Password'}
                    </button>
                  </form>
                </div>

                <hr />

                <div>
                  <h3 className="font-bold text-gray-900 mb-4">Logout dari Semua Device</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Logout dari semua device akan membuat Anda harus login ulang di semua perangkat yang terhubung.
                  </p>
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition"
                  >
                    Logout dari Semua Device
                  </button>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Login Terakhir</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {lastLogin ? lastLogin.toLocaleDateString('id-ID', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Baru kali ini'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password Terakhir Diubah</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {lastPasswordChange ? lastPasswordChange.toLocaleDateString('id-ID', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Belum pernah diubah'}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Tips Keamanan:</strong> Ubah password Anda secara berkala (setiap 3 bulan) untuk menjaga keamanan akun.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Logout dari Semua Device?</h3>
            <p className="text-gray-600 mb-6">
              Anda akan logout dari semua device. Anda harus login ulang untuk mengakses akun Anda.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-2 rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={handleLogoutAllDevices}
                disabled={logoutLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
              >
                {logoutLoading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
