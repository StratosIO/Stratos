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