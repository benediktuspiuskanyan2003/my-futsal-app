import winston from 'winston'
import path from 'path'

// Tentukan direktori logs
const logsDir = path.join(process.cwd(), 'logs')

// Konfigurasi format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
    // Format dasar: [TIMESTAMP] [LEVEL]: MESSAGE
    let logMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}`

    // Tambahkan metadata jika ada (contoh: user, action, error details)
    if (Object.keys(metadata).length > 0) {
      logMessage += ` | ${JSON.stringify(metadata)}`
    }

    // Tambahkan stack trace jika ada error
    if (stack) {
      logMessage += `\n${stack}`
    }

    return logMessage
  })
)

// Buat logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'futsal-app' },
  transports: [
    // 1. Console transport (untuk development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      ),
    }),

    // 2. File transport - ALL logs
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5, // Keep 5 files
    }),

    // 3. File transport - ERROR logs only
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),

    // 4. File transport - WARNING logs only
    new winston.transports.File({
      filename: path.join(logsDir, 'warning.log'),
      level: 'warn',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
})

// Export logger
export default logger
