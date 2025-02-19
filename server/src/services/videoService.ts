import sql from '../config/database.js'
import { mkdir } from 'fs/promises'

export const videoService = {
  uploadVideo: async (file: File) => {
    try {
      if (!file) {
        throw new Error('No file provided')
      }

      const UPLOAD_DIR = './uploads/videos'
      await mkdir(UPLOAD_DIR, { recursive: true })
      
      const fileName = `${crypto.randomUUID()}_${file.name}`
      const filePath = `${UPLOAD_DIR}/${fileName}`
      
      // Process file in chunks via stream
      const stream = file.stream()
      const chunks = []
      
      for await (const chunk of stream) {
        chunks.push(chunk)
      }
      
      await Bun.write(filePath, Buffer.concat(chunks))

      const result = await sql`
        INSERT INTO videos (
          file_name,
          file_path,
          file_size,
          mime_type
        ) VALUES (
          ${fileName},
          ${filePath},
          ${file.size},
          ${file.type}
        ) RETURNING id, file_name, file_path
      `

      return result[0]
    } catch (error) {
      throw error
    }
  }
}
