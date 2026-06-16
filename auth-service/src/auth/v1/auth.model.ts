import { t } from "elysia";

export const authModel = {
  'auth.register': t.Object({
    email: t.String({ format: 'email' }),
    password: t.String({ minLength: 8 }),
  }),
  'auth.login': t.Object({
    email: t.String({ format: 'email' }),
    password: t.String({ minLength: 8 }),
  }),
  'verification.check': t.Object({
    email: t.String({ format: 'email' }),
    code: t.String({ minLength: 4, maxLength: 4 })
  }),
  'verification.resend': t.Object({
    email: t.String({ format: 'email' }),
  }),
  'token.refresh': t.Object({
    refresh_token: t.String()
  })
}