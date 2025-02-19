import type { Context } from 'hono'
import { videoService } from '../services/videoService.js'
import log from '../config/logger.js'

export const videoController = {
  upload: async (c: Context) => {
    try {
      const body = await c.req.parseBody()
      const file = body.video as File
      
      if (!file || !(file instanceof File)) {
        log.warn('Upload attempted with no file')
        return c.json({ error: 'No file provided' }, 400)
      }

      log.info(`Processing upload: ${file.name} (${file.size} bytes)`)
      const result = await videoService.uploadVideo(file)
      log.info(`Successfully uploaded video: ${result.file_name}`)

      return c.json({ 
        success: true, 
        data: result,
        fileInfo: {
          name: file.name,
          type: file.type,
          size: file.size
        }
      })
    } catch (error) {
      log.error('Upload failed:', error)
      return c.json({ 
        success: false,
        error: 'Failed to upload video. Please try again.' 
      }, 500)
    }
  }
}
