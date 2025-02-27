import { v4 as uuidv4 } from 'uuid'
import { validate as validateUUID } from 'uuid'
import sql from '../config/database.js'
import log from '../config/logger.js'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { OUTPUT_CONFIG } from '../types/index.js'
import type { CommandValidationResult, Task } from '../types/index.js'

const execAsync = promisify(exec)

export const taskService = {
  ensureOutputDirectory: async () => {
    try {
      await fs.mkdir(OUTPUT_CONFIG.DIR, {
        recursive: true,
        mode: OUTPUT_CONFIG.PERMISSIONS,
      })

      // Double-check permissions in case directory already existed
      await fs.chmod(OUTPUT_CONFIG.DIR, OUTPUT_CONFIG.PERMISSIONS)
    } catch (error) {
      log.error('Failed to initialize output directory:', error)
      throw new Error('Failed to initialize output directory')
    }
  },

  validateCommand: async (command: string): Promise<CommandValidationResult> => {
    // Extract all potential UUIDs from the command
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
    const potentialFileIds = command.match(uuidRegex) || []

    // Filter to valid UUIDs
    const fileIds = potentialFileIds.filter((id) => validateUUID(id))

    if (fileIds.length === 0) {
      return { isValid: false, fileIds: [], error: 'No valid file IDs found in command' }
    }

    // Check if all files exist
    const existingFiles = await sql`
      SELECT id FROM files WHERE id IN ${sql(fileIds.map((id) => id))}
    `

    const foundIds = existingFiles.map((file) => file.id)
    const missingIds = fileIds.filter((id) => !foundIds.includes(id))

    if (missingIds.length > 0) {
      return {
        isValid: false,
        fileIds,
        error: `Files not found: ${missingIds.join(', ')}`,
      }
    }

    return { isValid: true, fileIds }
  },

  createTask: async (command: string, fileIds: string[]): Promise<Task> => {
    const taskId = uuidv4()

    // Create task record
    const [row] = await sql`
      INSERT INTO tasks (id, command, status)
      VALUES (${taskId}, ${command}, 'pending')
      RETURNING *
    `

    // Link files to task
    if (fileIds.length > 0) {
      const values = fileIds.map((fileId) => ({ task_id: taskId, file_id: fileId }))
      await sql`
        INSERT INTO task_files ${sql(values)}
      `
    }

    // Map the database row to Task type
    const task: Task = {
      id: row.id,
      command: row.command,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      result_path: row.result_path,
      error: row.error,
    }

    return task
  },

  executeCommand: async (taskId: string): Promise<void> => {
    try {
      // Ensure the output directory exists
      await taskService.ensureOutputDirectory()

      // Update task status to processing
      await sql`UPDATE tasks SET status = 'processing' WHERE id = ${taskId}`

      // Get task details
      const [task] = await sql`SELECT * FROM tasks WHERE id = ${taskId}`
      if (!task) {
        throw new Error('Task not found')
      }

      // Get file paths for all files associated with the task
      const taskFiles = await sql`
        SELECT f.id, f.file_path 
        FROM files f
        JOIN task_files tf ON f.id = tf.file_id
        WHERE tf.task_id = ${taskId}
      `

      // Create task-specific output directory if it doesn't exist
      const outputDir = path.join(OUTPUT_CONFIG.DIR, taskId)
      await fs.mkdir(outputDir, { recursive: true })

      // Prepare command by replacing file IDs with absolute file paths
      let processedCommand = task.command
      for (const file of taskFiles) {
        // Use absolute paths instead of relative paths
        const absoluteFilePath = path.resolve(file.file_path)
        processedCommand = processedCommand.replace(new RegExp(file.id, 'g'), absoluteFilePath)
      }

      // Execute FFmpeg command
      const { stdout, stderr } = await execAsync(`cd ${outputDir} && ${processedCommand}`)

      // Find output file(s)
      const outputFiles = await fs.readdir(outputDir)
      const resultPath = outputFiles.length > 0 ? path.join(outputDir, outputFiles[0]) : null

      // Update task as completed
      await sql`
        UPDATE tasks 
        SET status = 'completed', 
            result_path = ${resultPath}, 
            updated_at = NOW() 
        WHERE id = ${taskId}
      `

      log.info(`Task ${taskId} completed successfully`)
    } catch (error) {
      log.error(`Error executing task ${taskId}:`, error)

      // Update task as failed
      await sql`
        UPDATE tasks 
        SET status = 'failed', 
            error = ${String(error)}, 
            updated_at = NOW() 
        WHERE id = ${taskId}
      `
    }
  },

  getTask: async (taskId: string): Promise<Task | null> => {
    const [row] = await sql`SELECT * FROM tasks WHERE id = ${taskId}`
    if (!row) return null

    // Map the database row to Task type
    const task: Task = {
      id: row.id,
      command: row.command,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      result_path: row.result_path,
      error: row.error,
    }

    return task
  },
}
