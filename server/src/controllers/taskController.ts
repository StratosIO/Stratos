import type { Context } from 'hono'
import { taskService } from '../services/taskService.js'
import {
  parseCommand,
  getBuiltinCommands,
  getBuiltinCommandDetails,
} from '../services/commandParser.js'
import log from '../config/logger.js'
import { validate as validateUUID } from 'uuid'

export const taskController = {
  submitCommand: async (c: Context) => {
    try {
      const body = await c.req.json()
      let commandResult

      if (typeof body.command === 'string') {
        // Parse the command string to determine type and structure
        commandResult = parseCommand(body.command)
      } else {
        const { type = 'ffmpeg', command } = body
        commandResult = {
          type,
          command,
        }
      }

      // Handle parsing errors
      if (commandResult.error) {
        return c.json({ error: commandResult.error }, 400)
      }

      // Get the actual command to execute
      let processedCommand = commandResult.command

      if (commandResult.type === 'builtin' && commandResult.transformedCommand) {
        processedCommand = commandResult.transformedCommand
      }

      // Validate command and extract file IDs
      const validation = await taskService.validateCommand(processedCommand)

      if (!validation.isValid) {
        return c.json({ error: validation.error }, 400)
      }

      // Create task
      const task = await taskService.createTask(processedCommand, validation.fileIds)

      // Start processing in background
      taskService.executeCommand(task.id).catch((err) => {
        log.error(`Background task execution failed for ${task.id}:`, err)
      })

      return c.json(
        {
          success: true,
          task: {
            id: task.id,
            status: task.status,
            created_at: task.created_at,
          },
        },
        201,
      )
    } catch (error) {
      log.error('Failed to submit command:', error)
      return c.json({ error: 'Failed to process command' }, 500)
    }
  },

  getTaskStatus: async (c: Context) => {
    try {
      const taskId = c.req.param('id')

      if (!validateUUID(taskId)) {
        return c.json({ error: 'Invalid task ID' }, 400)
      }

      const task = await taskService.getTask(taskId)

      if (!task) {
        return c.json({ error: 'Task not found' }, 404)
      }

      return c.json({
        success: true,
        task: {
          id: task.id,
          status: task.status,
          created_at: task.created_at,
          updated_at: task.updated_at,
          result_path: task.result_path,
          error: task.error,
        },
      })
    } catch (error) {
      log.error('Failed to get task status:', error)
      return c.json({ error: 'Failed to retrieve task status' }, 500)
    }
  },

  getBuiltinCommands: async (c: Context) => {
    try {
      const commandName = c.req.query('name')

      // If command name is provided, return details for that command
      if (commandName) {
        const commandDetails = getBuiltinCommandDetails(commandName)
        if (!commandDetails) {
          return c.json({ error: 'Command not found' }, 404)
        }

        return c.json({
          success: true,
          command: commandDetails,
        })
      }

      // Otherwise return all commands
      const commands = getBuiltinCommands()
      return c.json({
        success: true,
        commands,
      })
    } catch (error) {
      log.error('Failed to get builtin commands:', error)
      return c.json({ error: 'Failed to retrieve builtin commands' }, 500)
    }
  },
}
