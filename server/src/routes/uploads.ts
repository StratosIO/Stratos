import { Hono } from 'hono'
import { uploadsController } from '../controllers/uploadsController.js'
import { authMiddleware } from '../middleware/auth.js'

const uploads = new Hono()

uploads.post('/', uploadsController.upload)
uploads.get('/', uploadsController.list)
uploads.delete('/:id', uploadsController.delete)
export default uploads
