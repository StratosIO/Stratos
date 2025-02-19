import { Hono } from "hono"
import { cors } from "hono/cors"
import multer from "multer"
import { transcribeAudio } from "../services/authService"

const whisper = new Hono()
const upload = multer({ dest: "uploads/" }).single("audio")

whisper.use("/*", cors())

whisper.post("/transcribe", async (c) => {
    return new Promise((resolve, reject) => {
        upload(c.req.raw, {} as any, async (err) => {
            if (err) {
                return resolve(c.json({ error: "File upload failed" }, 400))
            }

            const file = (c.req.raw as any).file
            if (!file) {
                return resolve(c.json({ error: "No audio file provided" }, 400))
            }

            try {
                const transcription = await transcribeAudio(file.path)
                resolve(c.json({ transcription}))
            } catch (error) {
                resolve(c.json({ error: "Error processing transcription" }, 500))
            }
        })
    })
})

export default whisper