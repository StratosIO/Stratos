import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'

const status = new Hono()

status.get('/', async (c) => {
  return streamSSE(c, async (stream) => {
    while (true) {
      await stream.writeSSE({ data: String(process.uptime()) })
      await stream.sleep(1000)
    }
  })
})

export default status
