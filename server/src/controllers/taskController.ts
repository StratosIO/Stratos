import type { Context } from 'hono';
import { taskService } from '../services/taskService.js';
import log from '../config/logger.js';
import { validate as validateUUID } from 'uuid';

export const taskController = {
  submitCommand: async (c: Context) => {
    try {
      const body = await c.req.json();
      const {command, type = 'ffmpeg' } = body; //default type to ffmpeg if not provided options are ffmpeg and builtin

      
      if (!command) {
        return c.json({ error: 'Command is required' }, 400);
      }

      if(type !== 'ffmpeg' && type !== 'ffprobe'){
        return c.json({ error: 'Invalid type' }, 400);
      }
      
      //handle command type of built in later!
      // For built-in commands, transform to the actual FFMPEG command
      let processedCommand = command;
      if (type === 'builtin') {
        // deal with builtin options here TODO
          return c.json({ error: `Unknown built-in command: ${command}` }, 400);
      }
      // Validate command and extract file IDs
      const validation = await taskService.validateCommand(processedCommand); //need to work on this and ensure we sanitze the command properly for now basic uuid validation
      
      if (!validation.isValid) {
        return c.json({ error: validation.error }, 400);
      }
      
      // Create task
      const task = await taskService.createTask(processedCommand, validation.fileIds);
      
      // Start processing in background 
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