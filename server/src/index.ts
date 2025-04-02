import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/bun'
import { authMiddleware, requireRole } from './middleware/auth.js'
import { createAdmin } from './scripts/createAdmin.js'
import { cleanupService } from './services/cleanupService.js'
import auth from './routes/auth.js'
import dev from './routes/dev.js'
import ai from './routes/ai.js'
import log from './config/logger.js'
import uploads from './routes/uploads.js'
import status from './routes/status.js'
import tasks from './routes/tasks.js'

const app = new Hono()

//Middleware
app.use('/*', cors())

const api = new Hono()
//Routes
api.route('/auth', auth)
api.route('/uploads', uploads)
api.route('/status', status)
api.route('/tasks', tasks)

app.route('/api', api)
app.route('/auth', auth)
app.route('/ai', ai)

//this route is only defined in dev env. not part of the actual application
if (process.env.NODE_ENV === 'development') {
  app.route('/dev', dev)
}

app.use('/*', serveStatic({ root: './dist' }))

app.get('*', serveStatic({ path: './dist/index.html' }))


// Schedule cleanup job to run every hour
const cleanupInterval = parseInt(process.env.CLEANUP_INTERVAL_MINUTES || '60', 10)
const cleanupJob = cleanupService.scheduleCleanupJob(cleanupInterval)

createAdmin() // adds default admin user to db if doesn't exist
log.info(`Server is running on http://localhost:3000`)

export default {
  port: 3000,
  hostname: '0.0.0.0',
  maxRequestBodySize: 3 * 1024 * 1024 * 1024, // 3GB in bytes
  fetch: app.fetch,
  dispose: () => {
    clearInterval(cleanupJob)
  }
}