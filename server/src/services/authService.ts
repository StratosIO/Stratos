import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import sql from '../config/database.js'
import type { User } from '../types/index.js'

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key'

export const authService = {
  registerUser: async (username: string, email: string, password: string) => {
    // Check if user exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email} OR username = ${username}
    `
    if (existingUser.length > 0) {
      throw new Error('User already exists')
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10)
    const result = await sql`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (${username}, ${email}, ${passwordHash}, 'user')
      RETURNING id, username, email, role
    `

    const user = result[0]
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role } as User,
      JWT_SECRET,
      { expiresIn: '24h' },
    )

    return { user, token }
  },

  loginUser: async (email: string, password: string) => {
    const users = await sql`
      SELECT id, username, email, password_hash, role
      FROM users WHERE email = ${email}
    `

    if (users.length === 0) {
      throw new Error('Invalid credentials')
    }

    const user = users[0]
    const validPassword = await bcrypt.compare(password, user.password_hash)

    if (!validPassword) {
      throw new Error('Invalid credentials')
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' },
    )

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    }
  },
}
