import { Hono } from "hono"
import axios from "axios"
import { writeFileSync, unlinkSync, existsSync, readFileSync } from "fs"
import FormData from "form-data"

const ai = new Hono()
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://ai_service:5001"

ai.post("/:job", async (c) => {
  const job = c.req.param("job")

  if (job != "transcribe") {
    return c.json({ error: `Unknown AI job: ${job}` }, 400)
  }

  const body = await c.req.parseBody()
  if (!body.audio || !(body.audio as File)) {
    return c.json({ error: "No audio file provided" }, 400)
  }

  const file = body.audio as File
  const tempFilePath = `/app/uploads/${file.name}`
  writeFileSync(tempFilePath, Buffer.from(await file.arrayBuffer()))

  const formData = new FormData()
  formData.append("audio", readFileSync(tempFilePath), file.name)

  try {
    const response = await axios.post(`${AI_SERVICE_URL}/${job}`, formData, {
      headers: { ...formData.getHeaders() },
    })

    if (existsSync(tempFilePath)) {
      unlinkSync(tempFilePath)
    }

    return c.json(response.data)
  } catch (error) {
    console.error(`[ERROR] AI job Failed: ${job}`, error)

    if (existsSync(tempFilePath)) {
      unlinkSync(tempFilePath)
    }

    return c.json({ error: "Failed to process audio" }, 500)
  }
})

export default ai

// import { Hono } from 'hono'
// import { cors } from 'hono/cors'
// import busboy from 'busboy'
// import { transcribeAudio } from '../services/whisperService.js'
// import fs from 'fs'
// import path from 'path'
// import { Readable } from 'stream'

// const whisper = new Hono()

// // Middleware to log incoming requests
// whisper.use('/*', async (c, next) => {
//   console.log(`[LOG] Incoming request: ${c.req.method} ${c.req.url}`)
//   console.log(`[LOG] Headers:`, c.req.header())
//   await next()
// })

// // Transcribe Audio Route
// whisper.post('/transcribe', async (c) => {
//   return new Promise(async (resolve, reject) => {
//     console.log('[LOG] Received request at /transcribe')

//     // Convert Hono's `ReadableStream` to a Node.js `Readable` stream
//     const buffer = Buffer.from(await c.req.arrayBuffer())
//     const nodeStream = Readable.from(buffer)

//     const bb = busboy({ headers: c.req.header() })
//     let filePath: string | null = null

//     bb.on('file', (fieldname, file, info) => {
//       const filename = info.filename
//       console.log('[LOG] Receiving file:', filename)

//       filePath = `/app/uploads/${filename}`
//       const stream = fs.createWriteStream(filePath)
//       file.pipe(stream)

//       stream.on('finish', async () => {
//         console.log('[LOG] File uploaded:', filePath)
//         if (!filePath) {
//           console.error('[ERROR] File path is null.')
//           resolve(c.json({ error: 'Error processing file' }, 500))
//         }

//         try {
//           const transcription = await transcribeAudio(filePath as string)
//           resolve(c.json({ transcription }))
//         } catch (error) {
//           console.error('[ERROR] Transcription failed:', error)
//           resolve(c.json({ error: 'Error processing transcription' }, 500))
//         }
//       })

//       stream.on('error', (err) => {
//         console.error('[ERROR] File save error:', err)
//         reject(c.json({ error: 'File upload failed' }, 500))
//       })
//     })

//     bb.on('finish', () => {
//       if (!filePath) {
//         console.error('[ERROR] No file received.')
//         resolve(c.json({ error: 'No audio file provided' }, 400))
//       }
//     })

//     // Use the correctly formatted Node.js stream
//     nodeStream.pipe(bb)
//   })
// })

// export default whisper
