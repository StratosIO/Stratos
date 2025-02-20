import sql from '../config/database.js'
import { mkdir, chmod, unlink } from 'fs/promises'
import { UPLOAD_CONFIG } from '../types/index.js'
import type { ListOptions, ListResult } from '../types/index.js'
import path from 'path'

export const uploadService = {
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
  upload: async (file: File) => {
    try {
      if (!file) {
        throw new Error('No file provided')
      }

      await uploadService.ensureUploadDirectory()

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
  deleteUpload: async (id: string) => {
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
      throw error
    }

    // Then remove from database
    await sql`
      DELETE FROM videos 
      WHERE id = ${id}::uuid
    `
  },
  listUploads: async (options: ListOptions): Promise<ListResult> => {
    const { limit, cursor } = options

    // Build the base query
    let baseQuery = sql`
      SELECT 
        id,
        file_name,
        file_size,
        mime_type,
        uploaded_at,
        file_path
      FROM videos
    `

    // Add cursor condition if it exists
    if (cursor) {
      baseQuery = sql`${baseQuery} 
        WHERE (uploaded_at, id) < (${cursor.timestamp}, ${cursor.id})`
    }

    // Add ordering and limit
    baseQuery = sql`${baseQuery} 
      ORDER BY uploaded_at DESC, id DESC 
      LIMIT ${limit + 1}`

    const videos = await baseQuery

    // Check if we have more items
    const hasMore = videos.length > limit
    const items = hasMore ? videos.slice(0, -1) : videos

    // Generate next cursor if we have more items
    let nextCursor = null
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1]
      const cursorData = {
        timestamp: lastItem.uploaded_at.toISOString(),
        id: lastItem.id,
      }
      nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64')
    }

    return {
      videos: items,
      nextCursor,
      hasMore,
    }
  },
}
