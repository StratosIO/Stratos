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
  'compress-video': {
    name: 'compress-video',
    description: 'Compress a video to reduce file size while maintaining acceptable quality',
    options: [
      {
        name: 'level',
        description: 'Compression level (light, medium, heavy)',
        type: 'string',
        default: 'medium',
      },
      {
        name: 'keep-resolution',
        description: 'Maintain original resolution',
        type: 'boolean',
        default: true,
      },
      {
        name: 'codec',
        description: 'Video codec (h264, h265, vp9)',
        type: 'string',
        default: 'h264',
      },
      {
        name: 'format',
        description: 'Output format (mp4, webm)',
        type: 'string',
        default: 'mp4',
      },
    ],
    transform: (input, options) => {
      const level = options.level || 'medium'
      const keepResolution = options['keep-resolution'] !== false
      const codec = options.codec || 'h264'
      const format = options.format || 'mp4'

      // CRF values - higher = more compression
      let crf, preset
      if (level === 'light') {
        crf = '23'
        preset = 'medium'
      } else if (level === 'medium') {
        crf = '28'
        preset = 'medium'
      } else if (level === 'heavy') {
        crf = '32'
        preset = 'slow'
      } else {
        // Default to medium if an invalid level is provided
        crf = '28'
        preset = 'medium'
      }

      // Resolution scaling (if needed)
      const scale = keepResolution ? '' : '-vf "scale=trunc(oh*a/2)*2:720"'

      // Codec and container format combinations
      if (codec === 'h264') {
        return `ffmpeg -i ${input} ${scale} -c:v libx264 -crf ${crf} -preset ${preset} -c:a aac -b:a 96k output.${format === 'webm' ? 'mp4' : format}`
      } else if (codec === 'h265') {
        return `ffmpeg -i ${input} ${scale} -c:v libx265 -crf ${crf} -preset ${preset} -c:a aac -b:a 96k output.${format === 'webm' ? 'mp4' : format}`
      } else if (codec === 'vp9') {
        return `ffmpeg -i ${input} ${scale} -c:v libvpx-vp9 -crf ${crf} -b:v 0 -c:a libopus -b:a 96k output.${format === 'mp4' ? 'webm' : format}`
      }
      // Default fallback
      return `ffmpeg -i ${input} ${scale} -c:v libx264 -crf ${crf} -preset ${preset} -c:a aac -b:a 96k output.mp4`
    },
  },
  'trim-video': {
  name: 'trim-video',
  description: 'Extract a segment from a video file',
  options: [
    {
      name: 'start',
      description: 'Start time (format: HH:MM:SS)',
      type: 'string',
      default: '00:00:00',
    },
    {
      name: 'end',
      description: 'End time (format: HH:MM:SS)',
      type: 'string',
      default: '',
    },
    {
      name: 'duration',
      description: 'Duration in seconds (alternative to end time)',
      type: 'number',
      default: 0,
    },
    {
      name: 'quality',
      description: 'Output quality (low, medium, high, copy)',
      type: 'string',
      default: 'copy',
    },
    {
      name: 'format',
      description: 'Output format (mp4, mov, webm)',
      type: 'string',
      default: 'mp4',
    },
  ],
  transform: (input, options) => {
    const start = options.start || '00:00:00';
    const format = options.format || 'mp4';
    
    // Handle duration vs end time (duration takes precedence if both are provided)
    let durationParam = '';
    if (options.duration && options.duration > 0) {
      durationParam = `-t ${options.duration}`;
    } else if (options.end && options.end.trim() !== '') {
      durationParam = `-to ${options.end}`;
    }
    
    // Quality settings
    const quality = options.quality || 'copy';
    let videoCodec, audioCodec, extraParams = '';
    
    if (quality === 'copy') {
      // Fast, lossless stream copy (no re-encoding)
      videoCodec = '-c:v copy';
      audioCodec = '-c:a copy';
    } else {
      // Re-encoding with quality settings
      if (format === 'mp4') {
        videoCodec = '-c:v libx264';
        audioCodec = '-c:a aac -b:a 128k';
        const crf = quality === 'high' ? '18' : quality === 'low' ? '28' : '23';
        extraParams = `-crf ${crf} -preset medium`;
      } else if (format === 'mov') {
        videoCodec = '-c:v prores';
        audioCodec = '-c:a pcm_s16le';
        const profile = quality === 'high' ? '3' : quality === 'low' ? '0' : '2';
        extraParams = `-profile:v ${profile}`;
      } else if (format === 'webm') {
        videoCodec = '-c:v libvpx-vp9';
        audioCodec = '-c:a libopus';
        const crf = quality === 'high' ? '18' : quality === 'low' ? '30' : '24';
        extraParams = `-crf ${crf} -b:v 0`;
      }
    }
    
    return `ffmpeg -ss ${start} -i ${input} ${durationParam} ${videoCodec} ${extraParams} ${audioCodec} output.${format}`;
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
