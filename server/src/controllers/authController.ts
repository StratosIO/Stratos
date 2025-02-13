import type { Context } from 'hono'
import { authService } from '../services/authService.js'

export const authController = {
  register: async (c: Context) => {
    try {
      const { username, email, password } = await c.req.json()
      const result = await authService.registerUser(username, email, password)
      return c.json(result)
    } catch (error) {
      console.error('Registration error:', error)
      return c.json({ error: 'Registration failed' }, 500)
    }
  },

  login: async (c: Context) => {
    try {
      const { email, password } = await c.req.json()
      const result = await authService.loginUser(email, password)
      return c.json(result)
    } catch (error) {
      console.error('Login error:', error)
      return c.json({ error: 'Login failed' }, 500)
    }
  },
}
