import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import sql from './config/database.js'
import dotenv from 'dotenv'
import { timeStamp } from 'console'

const app = new Hono()

app.get('/db-test', async (c) => {
  try {
    const result = await sql`SELECT NOW()`
    return c.json({
      status: 'Connected :D',
      timestamp: result[0].NOW,
    })
  } catch (error) {
    console.error('Db connection error:', error)
    return c.json({ error: 'Failed to connect to database' }, 500)
  }
})

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
  onListen: ({ hostname, port }) => {
    console.log(`Server started on ${hostname}:${port}`)
  },
})
