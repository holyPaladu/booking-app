import { SqlClient, withTransaction } from '../shared/db'
import {
  UserRoles,
  SafeUser,
  User,
  VerificationToken,
  UserRequest,
  CreateSession,
  findSessionByToken, createVerificationToken, FindVerificationTokenRequest
} from '../core/types'

export const authRepository = (sql: SqlClient) => {
  return {
    create: async (dto: UserRequest) => {
      const [row] = await sql<SafeUser[]>`
        INSERT INTO users (email, password_hash)
        VALUES (${dto.email}, ${dto.password})
        RETURNING id, email
      `
      return row
    },
    findByEmail: async (email: string) => {
      const [row] = await sql<SafeUser[]>`
        SELECT id, email FROM users
        WHERE email = ${email}
      `
      return row
    },
    findByEmailWithPassword: async (email: string) => {
      const [row] = await sql<User[]>`
        SELECT id, email, password_hash, email_verified, status, banned_at, deleted_at FROM users
        WHERE email = ${email}
      `
      return row
    },

    assignRole: async (userId: string, role = UserRoles.USER) => {
      await sql`
        INSERT INTO user_roles (user_id, role_id)
        SELECT ${userId}, id FROM roles
        WHERE name = ${role}
      `
    },

    createSession: async (dto: CreateSession) => {
      await sql`
        INSERT INTO sessions (user_id, refresh_token_hash, token_version, expires_at)
        VALUES (${dto.userId}, ${dto.refreshTokenHash}, ${dto.tokenVersion}, ${dto.expiresAt})
      `
    },
    findSession: async (dto: findSessionByToken) => {
      const [row] = await sql`
        SELECT * FROM sessions
        WHERE refresh_token_hash = ${dto.refreshToken}
      `
      return row
    },

    createVerificationToken: async (dto: createVerificationToken) => {
      await sql`
        INSERT INTO verification_tokens (user_id, type, channel, identifier, token_hash, expires_at)
        VALUES (${dto.userId}, 'email_confirm', 'email', ${dto.email}, ${dto.tokenHash}, ${dto.expiresAt})
      `
    },
    findVerificationToken: async (dto: FindVerificationTokenRequest) => {
      const [row] = await sql<VerificationToken[]>`
        SELECT * FROM verification_tokens
        WHERE user_id = ${dto.userId}
        AND type = ${dto.type} AND used = FALSE AND expires_at > NOW()
        LIMIT 1
      `
      return row
    },
    updateAttemptsVerificationToken: async (hash: string) => {
      await sql`
        UPDATE verification_tokens
        SET attempts = attempts + 1
        WHERE token_hash = ${hash}
      `
    },
    updateVerificationToken: async (hash: string) => {
      await sql`
          UPDATE verification_tokens
          SET used = true, used_at = NOW()
          WHERE token_hash = ${hash}
      `
    },
    updateExpireVerificationToken: async (userId: string) => {
      await sql`
        UPDATE verification_tokens
        SET expires_at = NOW()
        WHERE user_id = ${userId}
      `
    },

    // Transaction
    successCheckVerification: async (userId: string, hash: string) => {
      await withTransaction(sql, async (tx) => {
        await tx`
          UPDATE verification_tokens
          SET used = true, used_at = NOW()
          WHERE token_hash = ${hash}
        `

        await tx`
          UPDATE users
          SET email_verified = true, email_verified_at = NOW()
          WHERE id = ${userId}
        `
      })
    }
  }
}