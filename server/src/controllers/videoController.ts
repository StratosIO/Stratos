import type { Context } from 'hono'
import { videoService } from '../services/videoService.js'
import { videoValidation } from '../utils/videoValidation.js'
import log from '../config/logger.js'

export const videoController = {
  upload: async (c: Context) => {
    try {
      const body = await c.req.parseBody()
      const file = body.video

      if (!file || !(file instanceof File)) {
        log.warn('Upload attempted with no file')
        return c.json({ error: 'No file provided' }, 400)
      }

      const validation = videoValidation.validateVideo(file) // Validate the uploaded video
      if (!validation.isValid) {
        log.warn(`Invalid video upload: ${validation.error}`)
        return c.json({ error: validation.error }, 400)
      }

      log.info(`Starting video upload: ${file.name}`, {
        fileSize: file.size,
        mimeType: file.type,
      })

      const result = await videoService.uploadVideo(file)
      log.info(`Successfully uploaded video: ${result.file_name}`)

      return c.json({
        success: true,
        data: result,
        fileInfo: {
          name: file.name,
          type: file.type,
          size: file.size,
        },
      })
    } catch (error) {
      log.error('Video upload failed', { error: String(error) })
      return c.json(
        {
          success: false,
          error: 'Failed to upload video. Please try again.',
        },
        500,
      )
    }
  },
  delete: async (c: Context) => {
    try {
      const id = c.req.param('id')

      // Simple UUID validation
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        log.warn('Delete attempted with invalid ID', { id })
        return c.json({ error: 'Invalid video ID' }, 400)
      }

      await videoService.deleteVideo(id)
      log.info('Video deleted successfully', { id })

      return c.json({ success: true })
    } catch (error) {
      log.error('Failed to delete video', { error: String(error) })
      return c.json({ error: 'Failed to delete video' }, 500)
    }
  },
}
