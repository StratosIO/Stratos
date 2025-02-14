import type { Context } from 'hono'
import { authService } from '../services/authService.js'
import log from '../config/logger.js'

export const authController = {
  register: async (c: Context) => {
    try {
      const { username, email, password } = await c.req.json()
      const result = await authService.registerUser(username, email, password)
      log.info(`User registered successfully: ${email}`)
      return c.json(result)
    } catch (error) {
      log.error('Registration error:', error)
      return c.json({ error: 'Registration failed' }, 500)
    }
  },

  login: async (c: Context) => {
    try {
      const { email, password } = await c.req.json()
      const result = await authService.loginUser(email, password)
      log.info(`User logged in successfully: ${email}`)
      return c.json(result)
    } catch (error) {
      log.error('Login error:', error)
      return c.json({ error: 'Login failed' }, 500)
    }
  },
}
