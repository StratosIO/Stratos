import type { BuiltinCommandDefinition } from '../../types/index.js'
/**
 * Definitions for all AI-based built-in commands
 * These commands utilize AI capabilities for processing media files
 */
export const AI_COMMANDS: Record<string, BuiltinCommandDefinition> = {
  'transcribe-audio': {
    name: 'transcribe-audio',
    description: 'Transcribe audio to text using AI',
    options: [
      {
        name: 'language',
        description: 'Language of the audio (en, es, fr, etc.)',
        type: 'string',
        default: 'en',
      },
      {
        name: 'format',
        description: 'Output format (txt, srt, vtt)',
        type: 'string',
        default: 'txt',
      }
    ],
    transform: (input, options) => {
      // This is a placeholder for the actual AI implementation
      const language = options.language || 'en'
      const format = options.format || 'txt'
      
      // This is just a placeholder command 
      return `echo "AI transcription placeholder for ${input} in ${language}" > output.${format}`
    },
  },
  
  // Add more AI commands as needed
}

/**
 * Get all available AI commands
 */
export function getAICommands() {
  return Object.values(AI_COMMANDS).map((cmd) => ({
    name: cmd.name,
    description: cmd.description,
    options: cmd.options,
  }))
}

/**
 * Get details for a specific AI command
 */
export function getAICommandDetails(commandName: string) {
  if (!commandName) return null

  const command = AI_COMMANDS[commandName]
  if (!command) return null

  return {
    name: command.name,
    description: command.description,
    options: command.options,
  }
}