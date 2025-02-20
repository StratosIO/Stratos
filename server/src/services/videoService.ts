import sql from '../config/database.js'
import { mkdir, chmod } from 'fs/promises'
import { UPLOAD_CONFIG } from '../types/index.js'
import path from 'path'


export const videoService = {
  ensureUploadDirectory: async () => {
    try {
      await mkdir(UPLOAD_CONFIG.DIR, { 
        recursive: true,
        mode: UPLOAD_CONFIG.PERMISSIONS 
      })
      
      // Double-check permissions in case directory already existed
      await chmod(UPLOAD_CONFIG.DIR, UPLOAD_CONFIG.PERMISSIONS)
      
    } catch (error) {
      throw new Error('Failed to initialize upload directory')
    }
  },
  uploadVideo: async (file: File) => {
    try {
      if (!file) {
        throw new Error('No file provided')
      }

      await videoService.ensureUploadDirectory()
      
      const fileName = `${crypto.randomUUID()}_${file.name}`
      const filePath = path.join(UPLOAD_CONFIG.DIR, fileName)

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
  },
}
