import { Hono } from 'hono'
import { taskController } from '../controllers/taskController.js'
import { authMiddleware } from '../middleware/auth.js'

const tasks = new Hono()

// Apply auth middleware to all routes if needed
// tasks.use('/*', authMiddleware);

tasks.post('/', taskController.submitCommand)
tasks.get('/:id', taskController.getTaskStatus)

export default tasks
