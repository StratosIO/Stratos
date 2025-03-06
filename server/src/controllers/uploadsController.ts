import type { Context } from 'hono'
import { uploadService } from '../services/uploadService.js'
import { uploadValidation } from '../utils/uploadValidation.js'
import { validate as ValidUUID } from 'uuid'
import log from '../config/logger.js'
import type { ListQueryParams } from '../types/index.js'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../types/index.js'

export const uploadsController = {
  upload: async (c: Context) => {
    try {
      const body = await c.req.parseBody()
      const file = body.file
      const id = body.id as string

      if (!file || !(file instanceof File)) {
        log.warn('Upload attempted with no file')
        return c.json({ error: 'No file provided' }, 400)
      }

      if (!ValidUUID(id)) {
        log.warn('Upload attempted with invalid UUID')
        return c.json({ error: 'Invalid UUID provided' }, 400)
      }

      const validation = uploadValidation.validate(file)
      if (!validation.isValid) {
        log.warn(`Invalid upload: ${validation.error}`)
        return c.json({ error: validation.error }, 400)
      }

      log.info(`Starting file upload: ${file.name}`, {
        fileSize: file.size,
        mimeType: file.type,
        id: id,
      })

      const result = await uploadService.upload(file, id)
      log.info(`Successfully uploaded: ${result.file_name}`)

      return c.json({
        success: true,
        data: result,
        fileInfo: {
          name: file.name,
          type: file.type,
          size: file.size,
          id: id,
        },
      })
    } catch (error) {
      log.error(`Upload failed: ${error}`, { error: String(error) })
      return c.json(
        {
          success: false,
          error: 'Failed to upload. Please try again.',
        },
        500,
      )
    }
  },
  delete: async (c: Context) => {
    try {
      const id = c.req.param('id')

      if (!ValidUUID(id)) {
        log.warn('Delete attempted with invalid UUID', { id })
        return c.json({ error: 'Invalid UUID' }, 400)
      }

      await uploadService.deleteUpload(id)
      log.info('File deleted successfully', { id })

      return c.json({ success: true })
    } catch (error) {
      return c.json({ error: 'Failed to delete file' }, 500)
    }
  },
  list: async (c: Context) => {
    try {
      const { limit, cursor } = c.req.query()

      // Parse and validate limit
      const parseLimit = parseInt(limit || String(DEFAULT_PAGE_SIZE))
      const validLimit = Math.min(Math.max(1, parseLimit), MAX_PAGE_SIZE)

      // Parse cursor if provided
      let cursorData
      if (cursor) {
        try {
          cursorData = JSON.parse(Buffer.from(cursor, 'base64').toString())
        } catch (e) {
          return c.json({ error: 'Invalid cursor' }, 400)
        }
      }

      const result = await uploadService.listUploads({
        limit: validLimit,
        cursor: cursorData,
      })

      return c.json({
        success: true,
        data: result.files,
        pagination: {
          next_cursor: result.nextCursor,
          has_more: result.hasMore,
        },
      })
    } catch (error) {
      log.error('Failed to list files', { error: String(error) })
      return c.json({ error: 'Failed to fetch files' }, 500)
    }
  },
}
