// src/app/api/logs/route.js
// API Route untuk menerima logs dari CLIENT dan simpan ke FILE

import { NextResponse } from 'next/server'
import logger from '../../../lib/logger'

export async function POST(request) {
  try {
    const { level, message, metadata } = await request.json()

    // Validasi
    if (!level || !message) {
      return NextResponse.json({ error: 'Invalid log data' }, { status: 400 })
    }

    // Log ke file (menggunakan server-side logger/winston)
    switch (level) {
      case 'debug':
        logger.debug(message, metadata)
        break
      case 'info':
        logger.info(message, metadata)
        break
      case 'warn':
        logger.warn(message, metadata)
        break
      case 'error':
        logger.error(message, metadata)
        break
      case 'critical':
        logger.error(`[CRITICAL] ${message}`, metadata)
        break
      default:
        logger.info(message, metadata)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logging API error:', error)
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 })
  }
}
