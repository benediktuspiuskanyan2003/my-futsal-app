// src/lib/clientLogger.js
// Logger untuk CLIENT-SIDE (pages dengan 'use client')
// ⚡ OPTIMIZED: Async fire-and-forget, disabled in development

// Check apakah kita di dev environment
const isDev = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'

// Helper: Kirim log ke server TANPA AWAIT (fire & forget)
// Ini tidak block UI/request lain
const sendLogAsync = (level, message, metadata) => {
  if (isDev) {
    // Dev: Hanya console.log, jangan kirim ke server
    console.log(`[${level.toUpperCase()}]`, message, metadata)
    return
  }

  // Production: Kirim ke server async (tidak await)
  fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, message, metadata })
  }).catch(err => console.error('Log send failed:', err))
}

export const clientLogger = {
  info(message, metadata = {}) {
    sendLogAsync('info', message, metadata)
  },

  warn(message, metadata = {}) {
    sendLogAsync('warn', message, metadata)
  },

  error(message, metadata = {}) {
    sendLogAsync('error', message, metadata)
  },

  debug(message, metadata = {}) {
    sendLogAsync('debug', message, metadata)
  },

  critical(message, metadata = {}) {
    sendLogAsync('critical', message, metadata)
  }
}

export default clientLogger
