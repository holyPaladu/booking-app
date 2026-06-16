import { ConflictError, ForbiddenError, NotFoundError, UnprocessableError } from "../shared/errors";
import { EventBus, EVENTS, type UserRegisteredPayload } from "../shared/event-bus";
import { createHash } from "../shared/utils";
import { cfg } from '../core/config/app.config';
import {CheckVerificationRequest, JWT, UserRequest, UserStatus, VerificationType} from "../core/types";
import { authRepository } from "./auth.repository";

export const authService = (repo: ReturnType<typeof authRepository>, event: EventBus) => {

  const hasher = createHash(cfg.getNumber('argon_memory'), cfg.getNumber('argon_time_cost'))

  const createHex = (token: string): string => {
    return new Bun.CryptoHasher('sha256').update(token).digest('hex')
  }
  async function createVerificationToken(): Promise<{ token: string, tokenHash: string, expiresAt: Date }> {
    const token = (crypto.getRandomValues(new Uint32Array(1))[0] % 9000 + 1000).toString()
    const tokenHash = new Bun.CryptoHasher('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 минут
    return { token, tokenHash, expiresAt }
  }

  return {
    register: async (payload: UserRequest) => {
      const findUser = await repo.findByEmail(payload.email)
      if (findUser) throw new ConflictError('User already exists', 'ALREADY_EXISTS')

      const hash = await hasher.hash(payload.password)
      const user = await repo.create({ email: payload.email, password: hash })

      const eventPayload: UserRegisteredPayload = {
        userId: user.id,
        email: user.email,
        registeredAt: new Date()
      }
      void event.emit<UserRegisteredPayload>(EVENTS.AUTH.USER_REGISTERED, eventPayload)

      return { message: `Successfully registered` }
    },

    login: async (jwt: JWT, payload: UserRequest) => {
      const findUser = await repo.findByEmailWithPassword(payload.email)
      if (!findUser) throw new NotFoundError("User")
      if (findUser.deleted_at) throw new NotFoundError("User")

      const isMatch = await hasher.verify(payload.password, findUser.password_hash)
      if (!isMatch) throw new ConflictError('User does not match')

      if (findUser.banned_at) throw new ForbiddenError(
        findUser.banned_reason ?? 'Account banned',
        'ACCOUNT_BANNED'
      )
      switch (findUser.status) {
        case UserStatus.PENDING_VERIFICATION:
          throw new UnprocessableError('Email not verified', 'EMAIL_NOT_VERIFIED')
        case UserStatus.INACTIVE:
          throw new UnprocessableError('Account inactive', 'ACCOUNT_INACTIVE')
        case UserStatus.BANNED:
          throw new ForbiddenError('Account banned', 'ACCOUNT_BANNED')
      }

      const token = await jwt.sign({ sub: findUser.id, email: findUser.email, version: findUser.token_version })
      // refresh token — случайная строка, 30 дней
      const refreshToken = Bun.randomUUIDv7().replace(/-/g, '') + Bun.randomUUIDv7().replace(/-/g, '')
      // пишем в sessions
      await repo.createSession({
        userId: findUser.id,
        refreshTokenHash: createHex(refreshToken),
        tokenVersion: findUser.token_version,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

      return { token, refresh_token: refreshToken }
    },

    // Verification module
    checkVerification: async (payload: CheckVerificationRequest) => {
      const existUser = await repo.findByEmail(payload.email)
      if (!existUser) throw new NotFoundError("User")

      const existHex = createHex(payload.code)
      const existToken = await repo.findVerificationToken({ userId: existUser.id, type: VerificationType.EMAIL_CONFIRM })
      if (!existToken) throw new NotFoundError("Token")

      if (existToken.used) throw new UnprocessableError("Token has already been verified")
      else if (existToken.attempts === existToken.max_attempts) throw new UnprocessableError("Token has expired")
      else if (existHex !== existToken.token_hash) {
        await repo.updateAttemptsVerificationToken(existToken.token_hash)
        throw new UnprocessableError("Token don't match")
      }
      else await repo.successCheckVerification(existUser.id, existToken.token_hash)

      return { message: "Successfully verification" }
    },
    resendVerification: async (email: string) => {
      const existUser = await repo.findByEmail(email)
      if (!existUser) throw new NotFoundError("User")

      await repo.updateExpireVerificationToken(existUser.id)
      const data = await createVerificationToken()
      await repo.createVerificationToken({ userId: existUser.id, email: existUser.email, tokenHash: data.tokenHash, expiresAt: data.expiresAt })
      // after send email with [ data.token ]
    },

    // refreshingToken: async (payload) => {
    //   const hash = createHex(payload.refresh_token)
    //   const existSession = await repo.findSession({ refresh_token: hash })
    //   if (!existSession) throw new NotFoundError("Session")
    //
    //   if (new Date(existSession.expires_at) < new Date()) throw new UnprocessableError("Session token expired")
    //
    //   // return { token, refresh_token }
    // },

    // Events Service
    afterRegisterEvent: async (payload: UserRegisteredPayload) => {
      console.debug('[AfterRegisterEvent]', payload)
      await repo.assignRole(payload.userId)
      const data = await createVerificationToken()
      await repo.createVerificationToken({ userId: payload.userId, email: payload.email, tokenHash: data.tokenHash, expiresAt: data.expiresAt })
      console.debug('[AfterRegisterEvent]', data.token)
      // after send email with [ data.token ]
    }
  }
}