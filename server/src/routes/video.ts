import { Hono } from 'hono'
import { videoController } from '../controllers/videoController.js'
import { authMiddleware } from '../middleware/auth.js'

const videos = new Hono()

videos.post('/',videoController.upload)
export default videos
