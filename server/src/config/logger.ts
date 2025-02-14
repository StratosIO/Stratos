/* Logger Configuration
 * 
 * Log Levels (in order of priority):
 * - error (0): Critical errors that need immediate attention
 * - warn (1):  Warnings that don't stop the app but need attention
 * - info (2):  General application info (default level)
 * - http (3):  HTTP request logs
 * - debug (4): Detailed debugging information
 * 
 * Files Created:
 * - /logs/error.log: Contains only error level logs
 * - /logs/all.log:   Contains all logs based on set LOG_LEVEL
 * 
 * Environment Variables:
 * LOG_LEVEL: Set the logging level (default: 'info')
 * Example in .env file:
 * LOG_LEVEL=error   # Show only errors
 * LOG_LEVEL=warn    # Show errors and warnings
 * LOG_LEVEL=info    # Show errors, warnings, and info
 * LOG_LEVEL=http    # Show errors, warnings, info, and HTTP logs
 * LOG_LEVEL=debug   # Show all logs including debug
 * 
 * 
 * Logger.error('Database connection failed', error)
 * Logger.warn('API rate limit reached')
 * Logger.info('Server started on port 3000')
 * Logger.http('GET /api/users')
 * Logger.debug('Debug information', { debugData })
 */
import winston from 'winston'
import path from 'path'
import fs from 'fs'

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}
//colors for console logging :D
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

winston.addColors(colors)

//base format without colors for files
const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
)

//colored format for console
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
)

const transports = [
  // Console transport with colors
  new winston.transports.Console({
    format: consoleFormat
  }),
  
  // File transports without colors
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: baseFormat
  }),
  
  new winston.transports.File({ 
    filename: path.join(logsDir, 'all.log'),
    format: baseFormat
  }),
]

const log = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  transports,
})

export default log
