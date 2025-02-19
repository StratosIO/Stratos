import type { Request, Response } from 'express'
import { transcribeAudio } from '../services/whisperService.js'
import path from 'path'

export async function transcribe(req: Request, res: Response) {
  try {
    if (!(req as any).file) {
      return res.status(400).json({ error: 'No audio file provided' })
    }

    const filePath = path.resolve((req as any).file.path)
    const transcription = await transcribeAudio(filePath)

    res.json({ transcription })
  } catch (error) {
    res.status(500).json({ error: 'Error processing transcription' })
  }
}
