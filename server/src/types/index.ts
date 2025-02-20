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

// types for listing videos
 
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 50

export interface ListQueryParams {
  limit?: string
  cursor?: string
  // userId?: string
}

export interface ListOptions {
  limit: number
  cursor?: { timestamp: string; id: string }
  // userId?: string
}

export interface ListResult {
  videos: any[]
  nextCursor: string | null
  hasMore: boolean
}