import { Elysia } from "elysia"
import { jwt } from "@elysiajs/jwt"
import { bearer } from "@elysiajs/bearer"
import { UnauthorizedError, ForbiddenError } from '../errors'

interface JwtPayload {
  sub: string       // user id
  email: string
  version: number
  role: UserRole
  iat?: number
  exp?: number
}
type UserRole = "admin" | "host" | "guest"

// ─── Plugin: JWT verification ──────────────────────────────────
export const jwtPlugin = new Elysia({ name: "jwt-plugin" })
  .use(jwt({ name: "jwt", secret: Bun.env.JWT_SECRET!, exp: Bun.env.JWT_EXPIRY! }))
  .use(bearer())

// ─── Plugin: Authenticated context ────────────────────────────
// Добавляет currentUser в контекст — null если не авторизован
export const authPlugin = new Elysia({ name: "auth-plugin" })
  .use(jwtPlugin)
  .derive({ as: "global" }, async ({ jwt, bearer }): Promise<{ currentUser: JwtPayload | null }> => {
    if (!bearer) return { currentUser: null }
    try {
      const payload = await jwt.verify(bearer) as JwtPayload | false
      return { currentUser: payload || null }
    } catch {
      return { currentUser: null }
    }
  })

// ─── Macro: requireAuth ────────────────────────────────────────
// Использование: .get("/protected", handler, { requireAuth: true })
export const authMacro = new Elysia({ name: "auth-macro" })
  .use(authPlugin)
  .macro({
    requireAuth: (enabled: boolean) => ({
      beforeHandle({ currentUser }: { currentUser: JwtPayload | null }) {
        if (enabled && !currentUser) {
          throw new UnauthorizedError()
        }
      }
    }),
    requireRoles: (roles: UserRole[]) => ({
      beforeHandle({ currentUser }: { currentUser: JwtPayload | null }) {
        if (!currentUser) {
          throw new UnauthorizedError()
        }
        if (!roles.includes(currentUser.role)) {
          throw new ForbiddenError(`Required roles: ${roles.join(", ")}`)
        }
      }
    })
  })
