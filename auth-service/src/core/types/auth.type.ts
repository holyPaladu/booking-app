export interface User {
  id: string // UUID
  email: string
  email_verified: boolean
  phone: string
  phone_verified: boolean
  password_hash: string
  status: UserStatus
  banned_reason: string
  banned_by: string // UUID
  banned_at: Date
  token_version: number
  deleted_at: Date
  deleted_by: string // UUID
  created_at: Date
  updated_at: Date
}
export type UserRequest = { email: string, password: string }
export type SafeUser = { id: string, email: string }

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
  PENDING_VERIFICATION = 'pending_verification',
}
export enum UserRoles {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}


export interface VerificationToken {
  id: string
  user_id: string
  type: VerificationType
  channel: VerificationChannel
  identifier: string
  token_hash: string
  attempts: number
  max_attempts: number
  used: boolean
  used_at?: Date
  expires_at: Date
  created_at: Date
}
export type createVerificationToken = { userId: string, email: string, tokenHash: string, expiresAt: Date}
export type CheckVerificationRequest =  { email: string, code: string}
export type FindVerificationTokenRequest = { userId: string, type: VerificationType }

export enum VerificationType {
  EMAIL_CONFIRM = 'email_confirm',
  PHONE_CONFIRM = 'phone_confirm',
  PASSWORD_RESET = 'password_reset',
  TWO_FACTOR_SETUP = 'two_factor_setup'
}
export enum VerificationChannel {
  EMAIL = 'email',
  SMS = 'sms'
}


export interface Session {
  id: string
  user_id: string
  refresh_token_hash: string
  token_version: number
  user_agent?: string
  ip_address?: string
  device_name?: string
  expires_at: Date
  last_used_at: Date
  created_at: Date
}
export type CreateSession = { userId: string, refreshTokenHash: string, tokenVersion: number, expiresAt: Date }
export type findSessionByToken = { refreshToken: string }