import { Hono } from 'hono'
import sql from '../config/database.js'
import { createAdmin } from '../scripts/createAdmin.js'

// this file contains endpoints that I am using for development / testing purposes.
// These are not part of the application!
const dev = new Hono()

dev.post('/reset-db', async (c) => {
  try {
    // Delete all data from tables
    await sql`TRUNCATE users CASCADE`

    createAdmin()
    return c.json({ message: 'Database reset successfully' })
  } catch (error) {
    console.error('Database reset error:', error)
    return c.json({ error: 'Failed to reset database' }, 500)
  }
})

export default dev
