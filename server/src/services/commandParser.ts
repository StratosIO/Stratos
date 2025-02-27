import { validate as validateUUID } from 'uuid';
import type { ParsedCommand, BuiltinCommandDefinition, CommandOption } from '../types/index.js';

const BUILTIN_COMMANDS: Record<string, BuiltinCommandDefinition> = {
  'extract-audio': {
    name: 'extract-audio',
    description: 'Extract audio from a video file to MP3',
    options: [
      { name: 'quality', description: 'Audio quality (low, medium, high)', type: 'string', default: 'medium' },
      { name: 'format', description: 'Output format (mp3, wav, aac)', type: 'string', default: 'mp3' }
    ],
    transform: (input, options) => {
      const format = options.format || 'mp3';
      let codec, ext;
      
      if (format === 'mp3') {
        codec = 'libmp3lame';
        ext = 'mp3';
      } else if (format === 'wav') {
        codec = 'pcm_s16le';
        ext = 'wav';
      } else if (format === 'aac') {
        codec = 'aac';
        ext = 'aac';
      } else {
        codec = 'libmp3lame';
        ext = 'mp3';
      }

      const quality = options.quality === 'high' ? '192k' : (options.quality === 'low' ? '96k' : '128k');
      return `ffmpeg -i ${input} -vn -acodec ${codec} -b:a ${quality} output.${ext}`;
    }
  },
  
  'convert-video': {
    name: 'convert-video',
    description: 'Convert video to different format',
    options: [
      { name: 'format', description: 'Output format (mp4, mov, webm)', type: 'string', default: 'mp4' },
      { name: 'quality', description: 'Video quality (low, medium, high)', type: 'string', default: 'medium' },
      { name: 'resolution', description: 'Output resolution (e.g., 1280x720)', type: 'string' }
    ],
    transform: (input, options) => {
      const format = options.format || 'mp4';
      const quality = options.quality === 'high' ? '18' : (options.quality === 'low' ? '28' : '23');
      const resolution = options.resolution ? `-vf scale=${options.resolution}` : '';
      
      if (format === 'mp4') {
        return `ffmpeg -i ${input} -c:v libx264 -crf ${quality} ${resolution} -preset medium -c:a aac -b:a 128k output.mp4`;
      } else if (format === 'mov') {
        return `ffmpeg -i ${input} -c:v prores -profile:v 3 ${resolution} -c:a pcm_s16le output.mov`;
      } else if (format === 'webm') {
        return `ffmpeg -i ${input} -c:v libvpx-vp9 -crf ${quality} ${resolution} -b:v 0 -c:a libopus output.webm`;
      }
      
      return `ffmpeg -i ${input} ${resolution} output.${format}`;
    }
  },
  
  'create-thumbnail': {
    name: 'create-thumbnail',
    description: 'Create a thumbnail from a video',
    options: [
      { name: 'time', description: 'Time position (e.g., 00:01:23)', type: 'string', default: '00:00:01' },
      { name: 'resolution', description: 'Output resolution (e.g., 640x360)', type: 'string', default: '640x360' }
    ],
    transform: (input, options) => {
      const time = options.time || '00:00:01';
      const resolution = options.resolution || '640x360';
      return `ffmpeg -i ${input} -ss ${time} -vframes 1 -vf scale=${resolution} output.jpg`;
    }
  },
  
  'create-gif': {
    name: 'create-gif',
    description: 'Create an animated GIF from a video',
    options: [
      { name: 'start', description: 'Start time (e.g., 00:01:23)', type: 'string', default: '00:00:00' },
      { name: 'duration', description: 'Duration in seconds', type: 'number', default: 5 },
      { name: 'fps', description: 'Frames per second', type: 'number', default: 10 },
      { name: 'width', description: 'Width in pixels (height auto)', type: 'number', default: 320 }
    ],
    transform: (input, options) => {
      const start = options.start || '00:00:00';
      const duration = options.duration || '5';
      const fps = options.fps || '10';
      const width = options.width || '320';
      
      return `ffmpeg -i ${input} -ss ${start} -t ${duration} -vf "fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" output.gif`;
    }
  }
};

/**
 * Parse a command string to determine if it's a builtin or raw command
 */
export function parseCommand(commandStr: string): ParsedCommand {
  // Trim the command string
  commandStr = commandStr.trim();
  
  // Check if it's a built-in command (starts with /)
  if (commandStr.startsWith('/')) {
    return parseBuiltinCommand(commandStr);
  }
  
  // Otherwise, it's a raw FFmpeg command
  if (commandStr.startsWith('ffmpeg ')) {
    return {
      type: 'ffmpeg',
      command: commandStr
    };
  } else if (commandStr.startsWith('ffprobe ')) {
    return {
      type: 'ffprobe',
      command: commandStr
    };
  }
  
  return {
    type: 'ffmpeg',
    command: commandStr
  };
}

/**
 * Parse a built-in command with format: /command-name fileId [--option=value]
 */
function parseBuiltinCommand(commandStr: string): ParsedCommand {
  // Remove the leading slash
  const withoutSlash = commandStr.substring(1);
  
  // Split by spaces (but respect quoted strings)
  const parts = withoutSlash.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  
  if (parts.length < 2) {
    return {
      type: 'builtin',
      command: parts[0] || '', // Ensure command is always a string
      error: 'Built-in command requires at least a command name and input file ID'
    };
  }
  
  const commandName = parts[0];
  const input = parts[1];
  
  // Check if command exists
  if (!commandName || !BUILTIN_COMMANDS[commandName]) {
    return {
      type: 'builtin',
      command: commandName || '', // Ensure command is always a string
      input,
      error: `Unknown built-in command: ${commandName || 'empty'}`
    };
  }
  
  const commandDef = BUILTIN_COMMANDS[commandName];
  
  // Check if input is a valid UUID
  if (!validateUUID(input)) {
    return {
      type: 'builtin',
      command: commandName,
      input,
      error: 'Input must be a valid file ID (UUID format)'
    };
  }
  
  // Parse options (format: --name=value)
  const options: Record<string, string | number | boolean> = {};
  let outputName: string | undefined;
  
  for (let i = 2; i < parts.length; i++) {
    const part = parts[i];
    
    // Output name specification
    if (part.startsWith('--output=')) {
      outputName = part.substring('--output='.length);
      // Remove quotes if present
      if (outputName.startsWith('"') && outputName.endsWith('"')) {
        outputName = outputName.substring(1, outputName.length - 1);
      }
      continue;
    }
    
    // Regular option
    if (part.startsWith('--')) {
      const equalsIndex = part.indexOf('=');
      if (equalsIndex > 0) {
        const name = part.substring(2, equalsIndex);
        let value: string | number | boolean = part.substring(equalsIndex + 1);
        
        // Remove quotes if present
        if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        
        // Convert to number if it looks like one
        if (/^-?\d+(\.\d+)?$/.test(value as string)) {
          value = parseFloat(value as string);
        }
        
        // Convert to boolean if it's true/false
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        
        options[name] = value;
      }
    }
  }
  
  // Transform to actual FFmpeg command
  const ffmpegCommand = commandDef.transform(input, options);
  
  return {
    type: 'builtin',
    command: commandName,
    input,
    options,
    outputName,
    // Store the transformed command for execution
    transformedCommand: ffmpegCommand
  };
}

/**
 * Get all available built-in commands
 */
export function getBuiltinCommands() {
  return Object.values(BUILTIN_COMMANDS).map(cmd => ({
    name: cmd.name,
    description: cmd.description,
    options: cmd.options
  }));
}

/**
 * Get details for a specific built-in command
 */
export function getBuiltinCommandDetails(commandName: string) {
  if (!commandName) return null;
  
  const command = BUILTIN_COMMANDS[commandName];
  if (!command) return null;
  
  return {
    name: command.name,
    description: command.description,
    options: command.options
  };
}