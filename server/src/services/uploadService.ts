import sql from '../config/database.js'
import { mkdir, chmod, unlink } from 'fs/promises'
import { validate as ValidUUID } from 'uuid'
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
  upload: async (file: File, id: string, userId: number, expiresInHours = 24): Promise<any> => {
    try {
      await uploadService.ensureUploadDirectory()

      const fileName = file.name
      const filePath = path.join(UPLOAD_CONFIG.DIR, id)
      const fileWriter = Bun.file(filePath).writer()
      const stream = file.stream()
      let fileSize = 0

      for await (const chunk of stream) {
        fileWriter.write(chunk)
        fileSize += chunk.byteLength
      }

      await fileWriter.end()

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      const result = await sql`
        INSERT INTO files (
          id,
          file_name,
          file_path,
          file_size,
          mime_type,
          user_id,
          expires_at
        ) VALUES (
          ${id},
          ${fileName},
          ${filePath},
          ${fileSize},
          ${file.type},
          ${userId},
          ${expiresAt}
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
  listUploads: async (options: ListOptions): Promise<ListResult> => {
    const { limit, cursor, userId } = options

    // Build the base query
    let baseQuery = sql`
      SELECT 
        id,
        file_name,
        file_size,
        mime_type,
        uploaded_at,
        file_path,
        user_id
      FROM files
    `
    
    // Add user filtering if userId is provided
    if (userId) {
      if (cursor) {
        baseQuery = sql`${baseQuery} 
          WHERE user_id = ${userId} AND (uploaded_at, id) < (${cursor.timestamp}, ${cursor.id})`
      } else {
        baseQuery = sql`${baseQuery} 
          WHERE user_id = ${userId}`
      }
    } else if (cursor) {
      baseQuery = sql`${baseQuery} 
        WHERE (uploaded_at, id) < (${cursor.timestamp}, ${cursor.id})`
    }

    // Add ordering and limit
    baseQuery = sql`${baseQuery} 
      ORDER BY uploaded_at DESC, id DESC 
      LIMIT ${limit + 1}`

    const files = await baseQuery

    // Check if we have more items
    const hasMore = files.length > limit
    const items = hasMore ? files.slice(0, -1) : files

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
      files: items,
      nextCursor,
      hasMore,
    }
  },
  updateExpiration: async (fileId: string, expiresInHours: number): Promise<boolean> => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);
    
    const result = await sql`
      UPDATE files
      SET expires_at = ${expiresAt}
      WHERE id = ${fileId}
      RETURNING id
    `
    
    // Also update associated tasks
    if (result.length > 0) {
      await sql`
        UPDATE tasks
        SET expires_at = ${expiresAt}
        WHERE id IN (
          SELECT task_id FROM task_files WHERE file_id = ${fileId}
        )
      `
      return true
    }
    
    return false
  }
}
