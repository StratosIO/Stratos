import bcrypt from 'bcrypt'
import sql from '../config/database.js'
import log from '../config/logger.js'

export async function createAdmin() {
  try {
    // Check if admin exists first
    const adminExists = await sql`
      SELECT id FROM users WHERE email = 'admin@example.com'
    `

    if (adminExists.length === 0) {
      const adminPassword = 'admin123'
      const passwordHash = await bcrypt.hash(adminPassword, 10)

      await sql`
        INSERT INTO users (username, email, password_hash, role)
        VALUES ('admin', 'admin@example.com', ${passwordHash}, 'admin')
      `
      log.info('Admin user created successfully')
    } else {
      log.debug('Admin user already exists')
    }
  } catch (error) {
    log.error('Error creating admin:', error)
  }
}
