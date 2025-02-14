import type { Context, Next } from 'hono'
import type { User } from '../types/index.js'
import jwt from 'jsonwebtoken'
import log from '../config/logger.js'

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key'

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    log.warn('Authentication failed: No bearer token provided')
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as User
    log.info('Authentication succesful: ${decoded.email}')
    c.set('user', decoded)
    await next()
  } catch (err) {
    log.error('Authentication failed: Invalid token')
    return c.json({ error: 'Invalid token' }, 401)
  }
}

//use to include role based authentication for routes
//use as -> app.get('/api/test-auth', authMiddleware, requireRole('admin'), (c) =>
export function requireRole(requiredRole: string) {
  return async function roleMiddleware(c: Context, next: Next) {
    const user = c.get('user')

    if (user.role !== requiredRole && user.role !== 'admin') {
      log.warn(`Access denied: User ${user.username} with role ${user.role} attempted to access ${requiredRole} route`)
      return c.json({ error: 'Insufficient permissions' }, 403)
    }

    await next()
  }
}
