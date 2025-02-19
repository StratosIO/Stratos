import { Hono } from 'hono'
import { videoController } from '../controllers/videoController.js'
import { authMiddleware } from '../middleware/auth.js'

const videos = new Hono()

// videos.post('/upload', authMiddleware, videoController.upload)
videos.post('/upload',parse(), videoController.upload) // without authentication for testing

export default videos
