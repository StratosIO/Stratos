import sql from '../config/database.js'
import { mkdir, chmod, unlink } from 'fs/promises'
import { UPLOAD_CONFIG } from '../types/index.js'
import path from 'path'

export const videoService = {
  ensureUploadDirectory: async () => {
    try {
      await mkdir(UPLOAD_CONFIG.DIR, {
        recursive: true,
        mode: UPLOAD_CONFIG.PERMISSIONS,
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
  deleteVideo: async (id: string) => {
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      throw new Error('Invalid UUID format')
    }

    // First get the file path from database
    const video = await sql`
      SELECT file_path 
      FROM videos 
      WHERE id = ${id}::uuid
    `

    if (!video || video.length === 0) {
      throw new Error('Video not found')
    }

    // Delete the file first
    try {
      await unlink(video[0].file_path)
    } catch (error) {
      throw(error)
    }

    // Then remove from database
    await sql`
      DELETE FROM videos 
      WHERE id = ${id}::uuid
    `
  },
}
