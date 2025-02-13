// JWT User type - represents the data stored in JSON Web Tokens
// Only include fields that are needed for API operations and authentication
// Do NOT include sensitive data like password_hash
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
