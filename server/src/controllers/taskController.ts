import type { Context } from 'hono';
import { taskService } from '../services/taskService.js';
import log from '../config/logger.js';
import { validate as validateUUID } from 'uuid';

export const taskController = {
  submitCommand: async (c: Context) => {
    try {
      const { command } = await c.req.json();
      
      if (!command || typeof command !== 'string') {
        return c.json({ error: 'Valid command is required' }, 400);
      }
      
      // Validate command and extract file IDs
      const validation = await taskService.validateCommand(command);
      
      if (!validation.isValid) {
        return c.json({ error: validation.error }, 400);
      }
      
      // Create task
      const task = await taskService.createTask(command, validation.fileIds);
      
      // Start processing in background (don't await)
      taskService.executeCommand(task.id).catch(err => {
        log.error(`Background task execution failed for ${task.id}:`, err);
      });
      
      return c.json({
        success: true,
        task: {
          id: task.id,
          status: task.status,
          created_at: task.created_at
        }
      }, 201);
    } catch (error) {
      log.error('Failed to submit command:', error);
      return c.json({ error: 'Failed to process command' }, 500);
    }
  },
  
  getTaskStatus: async (c: Context) => {
    try {
      const taskId = c.req.param('id');
      
      if (!validateUUID(taskId)) {
        return c.json({ error: 'Invalid task ID' }, 400);
      }
      
      const task = await taskService.getTask(taskId);
      
      if (!task) {
        return c.json({ error: 'Task not found' }, 404);
      }
      
      return c.json({
        success: true,
        task: {
          id: task.id,
          status: task.status,
          created_at: task.created_at,
          updated_at: task.updated_at,
          result_path: task.result_path,
          error: task.error
        }
      });
    } catch (error) {
      log.error('Failed to get task status:', error);
      return c.json({ error: 'Failed to retrieve task status' }, 500);
    }
  }
}; 