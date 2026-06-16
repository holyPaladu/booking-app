import { Elysia } from "elysia";
import { authMacro } from "../../shared/plugins";
import { authModel } from "./auth.model";
import { authService } from "../auth.service";

export const authRouteV1 = (svc: ReturnType<typeof authService>) => {
  return new Elysia({ prefix: '/auth', tags: ['Auth'] })
    .use(authMacro)
    .model(authModel)
    .post('/register',
      ({ body }) => {
        return svc.register(body)
      }, { body: 'auth.register' }
    )
    .post('/login',
      ({ body, jwt }) => {
        return svc.login(jwt, body)
      }, { body: 'auth.login' }
    )
    .group("/verification", (verification) => verification
      .post("/check", ({ body }) => {
        return svc.checkVerification(body)
      }, { body: 'verification.check' })
      .post("/resend", ({ body }) => {
        return svc.resendVerification(body.email)
      }, { body: 'verification.resend' })
    )
    .post("/refresh-token", ({ body }) => {
      // return svc.refreshingToken(body)
    }, { body: 'token.refresh', requireAuth: true })
}