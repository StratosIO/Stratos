import { exec } from 'child_process'
import { promisify } from 'util'
import log from '../config/logger.js'

const execAsync = promisify(exec)

/**
 * Get the duration of a media file in seconds
 * @param filePath Path to the media file
 * @returns Duration in seconds or 0 if unable to determine
 */
export async function getMediaDuration(filePath: string): Promise<number> {
  try {
    // Use ffprobe to get duration
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    const { stdout, stderr } = await execAsync(command)
    
    if (stderr) {
      log.warn(`ffprobe stderr: ${stderr}`)
    }
    
    const duration = parseFloat(stdout.trim())
    return isNaN(duration) ? 0 : duration
  } catch (error) {
    log.error('Error getting media duration:', error)
    return 0
  }
}

/**
 * Get the duration of the first input file in an FFmpeg command
 * @param command FFmpeg command string
 * @returns Duration in seconds or 0 if unable to determine
 */
export async function getDurationFromCommand(command: string): Promise<number> {
  try {
    // Extract input file from command (simplistic approach, may need refinement)
    const inputMatch = command.match(/-i\s+["']?([^"'\s]+)["']?/)
    
    if (!inputMatch || !inputMatch[1]) {
      log.warn('Could not extract input file from command')
      return 0
    }
    
    const inputFile = inputMatch[1]
    return await getMediaDuration(inputFile)
  } catch (error) {
    log.error('Error extracting duration from command:', error)
    return 0
  }
}