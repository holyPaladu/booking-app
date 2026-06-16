export const EVENTS = {
  AUTH: {
    USER_REGISTERED: 'auth.user_registered',
    USER_LOGGED_IN:  'auth.user_logged_in',
  }
} as const

// Типы payload для каждого события
export interface UserRegisteredPayload {
  userId: string
  email: string
  registeredAt: Date
}
export interface UserLoggedInPayload {
  userId: string
  email: string
  loggedInAt: Date
}