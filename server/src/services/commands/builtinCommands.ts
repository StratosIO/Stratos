import type { BuiltinCommandDefinition } from '../../types/index.js'

/**
 * Definitions for all built-in commands
 */
export const BUILTIN_COMMANDS: Record<string, BuiltinCommandDefinition> = {
  'extract-audio': {
    name: 'extract-audio',
    description: 'Extract audio from a video file to MP3',
    options: [
      {
        name: 'quality',
        description: 'Audio quality (low, medium, high)',
        type: 'string',
        default: 'medium',
      },
      {
        name: 'format',
        description: 'Output format (mp3, wav, aac)',
        type: 'string',
        default: 'mp3',
      },
    ],
    transform: (input, options) => {
      const format = options.format || 'mp3'
      let codec, ext

      if (format === 'mp3') {
        codec = 'libmp3lame'
        ext = 'mp3'
      } else if (format === 'wav') {
        codec = 'pcm_s16le'
        ext = 'wav'
      } else if (format === 'aac') {
        codec = 'aac'
        ext = 'aac'
      } else {
        codec = 'libmp3lame'
        ext = 'mp3'
      }

      const quality =
        options.quality === 'high' ? '192k' : options.quality === 'low' ? '96k' : '128k'
      return `ffmpeg -i ${input} -vn -acodec ${codec} -b:a ${quality} output.${ext}`
    },
  },

  'convert-video': {
    name: 'convert-video',
    description: 'Convert video to different format',
    options: [
      {
        name: 'format',
        description: 'Output format (mp4, mov, webm)',
        type: 'string',
        default: 'mp4',
      },
      {
        name: 'quality',
        description: 'Video quality (low, medium, high)',
        type: 'string',
        default: 'medium',
      },
      { name: 'resolution', description: 'Output resolution (e.g., 1280x720)', type: 'string' },
    ],
    transform: (input, options) => {
      const format = options.format || 'mp4'
      const quality = options.quality === 'high' ? '18' : options.quality === 'low' ? '28' : '23'
      const resolution = options.resolution ? `-vf scale=${options.resolution}` : ''

      if (format === 'mp4') {
        return `ffmpeg -i ${input} -c:v libx264 -crf ${quality} ${resolution} -preset medium -c:a aac -b:a 128k output.mp4`
      } else if (format === 'mov') {
        return `ffmpeg -i ${input} -c:v prores -profile:v 3 ${resolution} -c:a pcm_s16le output.mov`
      } else if (format === 'webm') {
        return `ffmpeg -i ${input} -c:v libvpx-vp9 -crf ${quality} ${resolution} -b:v 0 -c:a libopus output.webm`
      }

      return `ffmpeg -i ${input} ${resolution} output.${format}`
    },
  },

  'create-thumbnail': {
    name: 'create-thumbnail',
    description: 'Create a thumbnail from a video',
    options: [
      {
        name: 'time',
        description: 'Time position (e.g., 00:01:23)',
        type: 'string',
        default: '00:00:01',
      },
      {
        name: 'resolution',
        description: 'Output resolution (e.g., 640x360)',
        type: 'string',
        default: '640x360',
      },
    ],
    transform: (input, options) => {
      const time = options.time || '00:00:01'
      const resolution = options.resolution || '640x360'
      return `ffmpeg -i ${input} -ss ${time} -vframes 1 -vf scale=${resolution} output.jpg`
    },
  },

  'create-gif': {
    name: 'create-gif',
    description: 'Create an animated GIF from a video',
    options: [
      {
        name: 'start',
        description: 'Start time (e.g., 00:01:23)',
        type: 'string',
        default: '00:00:00',
      },
      { name: 'duration', description: 'Duration in seconds', type: 'number', default: 5 },
      { name: 'fps', description: 'Frames per second', type: 'number', default: 10 },
      { name: 'width', description: 'Width in pixels (height auto)', type: 'number', default: 320 },
    ],
    transform: (input, options) => {
      const start = options.start || '00:00:00'
      const duration = options.duration || '5'
      const fps = options.fps || '10'
      const width = options.width || '320'

      return `ffmpeg -i ${input} -ss ${start} -t ${duration} -vf "fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" output.gif`
    },
  },
}

/**
 * Get all available built-in commands
 */
export function getBuiltinCommands() {
  return Object.values(BUILTIN_COMMANDS).map((cmd) => ({
    name: cmd.name,
    description: cmd.description,
    options: cmd.options,
  }))
}

/**
 * Get details for a specific built-in command
 */
export function getBuiltinCommandDetails(commandName: string) {
  if (!commandName) return null

  const command = BUILTIN_COMMANDS[commandName]
  if (!command) return null

  return {
    name: command.name,
    description: command.description,
    options: command.options,
  }
}
