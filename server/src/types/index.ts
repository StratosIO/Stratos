// JWT User type - represents the data stored in JSON Web Tokens
// Only include fields that are needed for API operations and authentication
export interface User {
  userId: number
  username: string
  role: string
}

// Extend Hono's Context type to include our user
declare module 'hono' {
  interface ContextVariableMap {
    user: User
  }
}

export const UPLOAD_CONFIG = {
  DIR: process.env.UPLOAD_DIR || './uploads',
  PERMISSIONS: 0o755, // rwxr-xr-x
}

// Configuration for output files
export const OUTPUT_CONFIG = {
  DIR: process.env.OUTPUT_DIR || './outputs',
  PERMISSIONS: 0o755, // rwxr-xr-x
}

// types for listing files

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 50

export interface ListQueryParams {
  limit?: string
  cursor?: string
  // userId?: string
}

export interface ListOptions {
  limit: number
  cursor?: string
  // userId?: string
}

export interface FileListResult {
  files: any[]
  nextCursor: string | null
  hasMore: boolean
}

// Task list result type
export interface TaskListResult {
  tasks: (Task & { fileIds?: string[] })[]
  nextCursor: string | null
  hasMore: boolean
}

export interface Task {
  id: string
  command: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: Date
  updated_at: Date
  result_path?: string
  error?: string
  files?: TaskFileDownloadInfo[]
}

export interface CommandValidationResult {
  isValid: boolean
  fileIds: string[]
  error?: string
}

// types for parsing commands
export interface ParsedCommand {
  type: 'ffmpeg' | 'ffprobe' | 'builtin' | 'ai'
  command: string
  input?: string
  options?: Record<string, string | number | boolean>
  outputName?: string
  error?: string
  transformedCommand?: string
}

export interface CommandOption {
  name: string
  description: string
  type: 'string' | 'number' | 'boolean'
  default?: string | number | boolean
}

export interface BuiltinCommandDefinition {
  name: string
  description: string
  options: CommandOption[]
  transform: (input: string, options: Record<string, any>) => string
}

export interface AICommandDefinition {
  name: string
  description: string
  options: CommandOption[]
}

export interface TaskFile {
  filename: string
  path: string
  size: number
  mime_type: string
}

export interface TaskFilesResult {
  files: TaskFile[]
  single: TaskFile | null
  error?: string
}

export interface TaskFileDownloadInfo {
  filename: string
  download_url: string
  size: number
  mime_type: string
}
