import sql from '../config/database.js'
import { mkdir, chmod, unlink } from 'fs/promises'
import { validate as ValidUUID } from 'uuid'
import { UPLOAD_CONFIG } from '../types/index.js'
import type { ListOptions, FileListResult } from '../types/index.js'
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
  upload: async (file: File, id: string) => {
    try {
      await uploadService.ensureUploadDirectory()

      const fileName = file.name
      const fileType = file.type
      const filePath = path.join(UPLOAD_CONFIG.DIR, id)
      const fileWriter = Bun.file(filePath).writer()
      const stream = file.stream()
      let fileSize = 0

      for await (const chunk of stream) {
        fileWriter.write(chunk)
        fileSize += chunk.byteLength
      }

      await fileWriter.end()

      const result = await sql`
        INSERT INTO files (
          id,
          file_name,
          file_path,
          file_size,
          mime_type
        ) VALUES (
          ${id},
          ${fileName},
          ${filePath},
          ${fileSize},
          ${fileType}
        ) RETURNING id, file_name, file_path
      `

      return result[0]
    } catch (error) {
      throw error
    }
  },
  deleteUpload: async (id: string) => {
    if (!ValidUUID(id)) {
      throw new Error('Invalid UUID')
    }

    // First get the file path from database
    const [{ file_path: filePath } = {}] = await sql`
      SELECT file_path 
      FROM files 
      WHERE id = ${id}::uuid
    `

    if (!filePath) {
      throw new Error('File not found')
    }

    // Delete the file first
    try {
      await unlink(filePath)
    } catch (error) {
      throw error
    }

    // Then remove from database
    await sql`
      DELETE FROM files 
      WHERE id = ${id}::uuid
    `
  },
  listUploads: async (options: ListOptions): Promise<FileListResult> => {
    const { limit, cursor } = options

    // Build the base query
    let baseQuery = sql`
      SELECT 
        id,
        file_name AS name,
        file_size AS size,
        mime_type AS type,
        uploaded_at AS time,
        file_path
      FROM files
    `

    // Add cursor condition if it exists
    if (cursor) {
      baseQuery = sql`${baseQuery} 
        WHERE id < ${cursor}`
    }

    // Add ordering and limit
    baseQuery = sql`${baseQuery} 
      ORDER BY id DESC 
      LIMIT ${limit + 1}`

    const files = await baseQuery

    // Check if we have more items
    const hasMore = files.length > limit
    const items = hasMore ? files.slice(0, -1) : files

    // Generate next cursor if we have more items
    let nextCursor = null
    if (hasMore && items.length > 0) {
      nextCursor = items[items.length - 1].id
    }

    return {
      files: items,
      nextCursor,
      hasMore,
    }
  },
}
