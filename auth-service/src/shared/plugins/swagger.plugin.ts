import { swagger } from '@elysiajs/swagger'
import Elysia from 'elysia'

export const AuthSwaggerPlugin = new Elysia({ name: 'auth-swagger' })
  .use(swagger({
    path: '/swagger',
    provider: 'scalar',
    documentation: {
      info: {
        title: 'Auth Service API',
        version: '1.0.0',
      },
    },
  }))