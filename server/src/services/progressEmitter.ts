import { EventEmitter } from 'events'
import fs from 'fs'
import log from '../config/logger.js'
import sql from '../config/database.js'
import { getMediaDuration, getDurationFromCommand } from '../utils/mediaUtils.js'


// Create a singleton event emitter
const progressEmitter = new EventEmitter()

// Store active client connections
const clients = new Map<string, Set<Response>>()

/**
 * Parse FFmpeg progress output from a file
 * @param data FFmpeg progress output
 * @returns Parsed progress information
 */
function parseProgress(data: string): Record<string, any> {
  const progress: Record<string, any> = {}
  
  const lines = data.trim().split('\n')
  for (const line of lines) {
    const [key, value] = line.split('=')
    if (key && value) {
      progress[key.trim()] = value.trim()
    }
  }
  
  return progress
}

/**
 * Calculate progress percentage based on duration and current time
 * @param progress FFmpeg progress data
 * @param totalDuration Total duration in seconds
 * @returns Progress percentage (0-100)
 */
function calculateProgress(progress: Record<string, any>, totalDuration: number): number {
  if (!progress.out_time_ms || !totalDuration) return 0
  
  // Convert microseconds to seconds
  const currentTime = parseInt(progress.out_time_ms) / 1000000
  
  // Calculate percentage and clamp between 0-100
  const percentage = Math.min(Math.max(Math.round((currentTime / totalDuration) * 100), 0), 100)
  
  return percentage
}

/**
 * Start monitoring progress file for a task
 * @param taskId Task ID
 * @param progressFilePath Path to FFmpeg progress file
 */
export function startProgressMonitor(taskId: string, progressFilePath: string): void {
  let totalDuration = 0
  
  // Get video duration from the task
  const getVideoDuration = async () => {
    try {
      // Get task command to extract input file
      const [task] = await sql`SELECT command FROM tasks WHERE id = ${taskId}`
      if (!task) {
        return 0
      }
      
      return await getDurationFromCommand(task.command)
    } catch (error) {
      log.error(`Error getting video duration for task ${taskId}:`, error)
      return 0
    }
  }
  
  // Set up polling interval to read progress file
  const monitorInterval = setInterval(async () => {
    try {
      // Check if file exists
      if (!fs.existsSync(progressFilePath)) {
        return
      }
      
      // Read progress file
      const data = fs.readFileSync(progressFilePath, 'utf8')
      const progressData = parseProgress(data)
      
      // Get total duration on first read if needed
      if (!totalDuration && progressData.total_size) {
        totalDuration = await getVideoDuration()
      }
      
      // Extract relevant information
      const progressPercentage = calculateProgress(progressData, totalDuration)
      
      // Create progress event
      const progressEvent = {
        taskId,
        progress: progressPercentage,
        status: 'processing',
        frame: parseInt(progressData.frame || '0'),
        fps: parseFloat(progressData.fps || '0'),
        speed: progressData.speed || '0x',
        time: progressData.out_time || '00:00:00',
      }
      
      // Emit progress event
      progressEmitter.emit('progress', progressEvent)
      
    } catch (error) {
      log.error(`Error monitoring progress for task ${taskId}:`, error)
    }
  }, 1000) // Poll every second
  
  // Clean up interval when task completes (listen to own emitted events)
  const cleanupListener = (event: any) => {
    if (event.taskId === taskId && (event.status === 'completed' || event.status === 'failed')) {
      clearInterval(monitorInterval)
      progressEmitter.off('progress', cleanupListener)
      
      // Try to clean up the progress file
      try {
        if (fs.existsSync(progressFilePath)) {
          fs.unlinkSync(progressFilePath)
        }
      } catch (error) {
        log.warn(`Could not delete progress file for task ${taskId}:`, error)
      }
    }
  }
  
  progressEmitter.on('progress', cleanupListener)
}

/**
 * Subscribe a client to progress updates for a specific task
 * @param taskId Task ID
 * @param client SSE client response object
 */
export function subscribeToTask(taskId: string, client: Response): void {
  if (!clients.has(taskId)) {
    clients.set(taskId, new Set())
  }
  
  clients.get(taskId)?.add(client)
  
  log.info(`Client subscribed to task ${taskId}`)
}

/**
 * Unsubscribe a client from progress updates
 * @param taskId Task ID
 * @param client SSE client response object
 */
export function unsubscribeFromTask(taskId: string, client: Response): void {
  if (clients.has(taskId)) {
    clients.get(taskId)?.delete(client)
    
    // Clean up empty sets
    if (clients.get(taskId)?.size === 0) {
      clients.delete(taskId)
    }
  }
  
  log.info(`Client unsubscribed from task ${taskId}`)
}

// Set up listener to broadcast progress events to clients
progressEmitter.on('progress', (event) => {
  const { taskId } = event
  
  if (clients.has(taskId)) {
    const taskClients = clients.get(taskId) || new Set()
    
    for (const client of taskClients) {
      try {
        const data = `data: ${JSON.stringify(event)}\n\n`
        // @ts-ignore - Write to the SSE stream
        client.write(data)
        
        // If task is completed or failed, close the connection
        if (event.status === 'completed' || event.status === 'failed') {
          // @ts-ignore - Close the connection
          client.end()
          unsubscribeFromTask(taskId, client)
        }
      } catch (error) {
        log.error(`Error sending progress event to client for task ${taskId}:`, error)
        unsubscribeFromTask(taskId, client)
      }
    }
  }
})

export { progressEmitter }