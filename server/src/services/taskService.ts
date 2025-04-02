import { v4 as uuidv4 } from 'uuid'
import { validate as validateUUID } from 'uuid'
import sql from '../config/database.js'
import log from '../config/logger.js'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { OUTPUT_CONFIG } from '../types/index.js'
import type {
  CommandValidationResult,
  Task,
  TaskFile,
  TaskFilesResult,
  ListOptions,
  TaskListResult,
} from '../types/index.js'
import { getContentType } from '../utils/fileUtils.js'

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

  createTask: async (command: string, fileIds: string[], userId: number): Promise<Task> => {
    const taskId = uuidv4()

    // Create task record
    const [row] = await sql`
      INSERT INTO tasks (id, command, status, user_id)
      VALUES (${taskId}, ${command}, 'pending', ${userId})
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
      user_id: row.user_id
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
      user_id: row.user_id
    }

    return task
  },
  getTaskFiles: async (taskId: string): Promise<TaskFilesResult> => {
    const outputDir = path.join(OUTPUT_CONFIG.DIR, taskId)

    try {
      const files = await fs.readdir(outputDir)

      if (files.length === 0) {
        return { files: [], single: null }
      }
      
      // Get task to retrieve user_id
      const [task] = await sql`SELECT user_id FROM tasks WHERE id = ${taskId}`
      const userId = task ? task.user_id : 0

      // Get details for each file
      const fileDetails: TaskFile[] = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(outputDir, file)
          const stats = await fs.stat(filePath)

          return {
            filename: file,
            path: filePath,
            size: stats.size,
            mime_type: getContentType(path.extname(file)),
            user_id: userId
          }
        }),
      )

      return {
        files: fileDetails,
        single: fileDetails.length === 1 ? fileDetails[0] : null,
      }
    } catch (error: unknown) {
      log.warn(`Error accessing output directory for task ${taskId}:`, error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { files: [], single: null, error: errorMessage }
    }
  },

  getTaskFile: async (taskId: string, filename: string): Promise<TaskFile> => {
    const filePath = path.join(OUTPUT_CONFIG.DIR, taskId, filename)

    try {
      const stats = await fs.stat(filePath)
      
      // Get task to retrieve user_id
      const [task] = await sql`SELECT user_id FROM tasks WHERE id = ${taskId}`
      const userId = task ? task.user_id : 0

      return {
        filename,
        path: filePath,
        size: stats.size,
        mime_type: getContentType(path.extname(filename)),
        user_id: userId
      }
    } catch (error) {
      log.warn(`Error accessing file ${filename} for task ${taskId}:`, error)
      throw new Error(`File not found: ${filename}`)
    }
  },

  deleteTask: async (taskId: string): Promise<boolean> => {
    if (!validateUUID(taskId)) {
      throw new Error('Invalid UUID')
    }

    try {
      // check if task exists and get its details
      const [task] = await sql`
        SELECT id, result_path 
        FROM tasks 
        WHERE id = ${taskId}
      `

      if (!task) {
        return false
      }

      // Delete task output directory if exists
      const outputDir = path.join(OUTPUT_CONFIG.DIR, taskId)
      try {
        await fs.rm(outputDir, { recursive: true, force: true })
      } catch (error) {
        log.warn(`Error deleting output directory for task ${taskId}:`, error)
      }

      // Delete related records and task from database in a transaction
      await sql.begin(async (sql) => {
        // delete task_files entries
        await sql`
          DELETE FROM task_files 
          WHERE task_id = ${taskId}
        `
        // delete the task itself
        await sql`
          DELETE FROM tasks 
          WHERE id = ${taskId}
        `
      })

      return true
    } catch (error) {
      log.error(`Error deleting task ${taskId}:`, error)
      throw new Error('Failed to delete task')
    }
  },
  listTasks: async (options: ListOptions): Promise<TaskListResult> => {
    const { limit, cursor, userId } = options
    
    // Build the base query
    let baseQuery = sql`
      SELECT 
        t.id, 
        t.command, 
        t.status, 
        t.created_at, 
        t.updated_at, 
        t.result_path, 
        t.error,
        t.user_id,
        array_agg(tf.file_id) as file_ids
      FROM tasks t
      LEFT JOIN task_files tf ON t.id = tf.task_id
    `
    
    // Add user filtering if userId is provided
    if (userId) {
      if (cursor) {
        baseQuery = sql`${baseQuery} 
          WHERE t.user_id = ${userId} AND (t.created_at, t.id) < (${cursor.timestamp}, ${cursor.id})
          GROUP BY t.id
          ORDER BY t.created_at DESC, t.id DESC
          LIMIT ${limit + 1}`
      } else {
        baseQuery = sql`${baseQuery} 
          WHERE t.user_id = ${userId}
          GROUP BY t.id
          ORDER BY t.created_at DESC, t.id DESC
          LIMIT ${limit + 1}`
      }
    } else if (cursor) {
      baseQuery = sql`${baseQuery} 
        WHERE (t.created_at, t.id) < (${cursor.timestamp}, ${cursor.id})
        GROUP BY t.id
        ORDER BY t.created_at DESC, t.id DESC
        LIMIT ${limit + 1}`
    } else {
      baseQuery = sql`${baseQuery} 
        GROUP BY t.id
        ORDER BY t.created_at DESC, t.id DESC
        LIMIT ${limit + 1}`
    }

    const rows = await baseQuery
    
    // Check if we have more items
    const hasMore = rows.length > limit
    const items = hasMore ? rows.slice(0, -1) : rows
    
    // Generate next cursor if we have more items
    let nextCursor = null
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1]
      const cursorData = {
        timestamp: lastItem.created_at.toISOString(),
        id: lastItem.id,
      }
      nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64')
    }
    
    // Map rows to Task objects
    const tasks = items.map(row => ({
      id: row.id,
      command: row.command,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      result_path: row.result_path,
      error: row.error,
      user_id: row.user_id,
      fileIds: row.file_ids.filter((id: string | null) => id) // Filter out null values
    }))
    
    return {
      tasks,
      nextCursor,
      hasMore,
    }
  },
}
