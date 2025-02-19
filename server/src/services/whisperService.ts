import { OpenAI } from "openai"
import fs from "fs"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function transcribeAudio(filePath: string): Promise<string> {
    try{
        const fileStream = fs.createReadStream(filePath)

        const response = await openai.audio.transcriptions.create({
            file: fileStream,
            model: "whisper-1",
            language: "en",
        })
        
        return response.text
    } catch (error) {
        console.error("Error transcribing audio:", error)
        throw new Error("Transcription failed")
    }
}