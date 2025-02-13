import bcrypt from 'bcrypt'
import sql from '../config/database.js'

export async function createAdmin() {
  try {
    //wait for db connection
    await sql`SELECT 1`
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
      console.log('Admin user created successfully')
    } else {
      console.log('Admin user already exists')
    }
  } catch (error) {
    console.error('Error creating admin:', error)
  }
}
