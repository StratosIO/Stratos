import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authMiddleware, requireRole } from './middleware/auth.js'
import { createAdmin } from './scripts/create-admin.js'
import auth from './routes/auth.js'
import dev from './routes/dev.js'
import ai from './routes/ai.js'
import log from './config/logger.js'
import uploads from './routes/uploads.js'
import status from './routes/status.js'

const app = new Hono()

//Middleware
app.use('/*', cors())

const api = new Hono()
//Routes
api.route('/auth', auth)
api.route('/uploads', uploads)
api.route('/status', status)
api.route('/ai', ai)

app.route('/api', api)
app.route('/auth', auth)

//this route is only defined in dev env. not part of the actual application
if (process.env.NODE_ENV === 'development') {
  app.route('/dev', dev)
}

app.get('/', (c) => {
  return c.text('Stratos Api')
})

createAdmin() // adds default admin user to db if doesn't exist
log.info(`Server is running on http://localhost:3000`)

export default app
