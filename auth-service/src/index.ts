import { Elysia } from 'elysia'
import { createDatabase } from "./shared/db";
import { errorPlugins } from './shared/plugins'
import { createEventBus } from './shared/event-bus';
import { cfg } from './core/config/app.config'
import { AuthSwaggerPlugin } from './shared/plugins'
import { runMigrations } from './core/migrations'
import { authRepository } from './auth/auth.repository'
import { authService } from './auth/auth.service'
import { authRouteV1 } from './auth/v1/auth.route'
import { authEvent } from './auth/auth.event'

async function bootstrap(): Promise<void> {
  const sql = createDatabase(cfg.get('db_url'))
  await runMigrations(sql)
  const repo = authRepository(sql)

  const event = createEventBus()
  const svc = authService(repo, event)

  const app = new Elysia()
    .use(errorPlugins)
    .use(AuthSwaggerPlugin)
    .onStart(() => {
      authEvent(event, { svc })
    })
    .group('/api',(app) => app
      .group('/v1', (v1) => v1
        .use(authRouteV1(svc))
      )
    )
    .listen(cfg.getNumber('port'))

  console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
  console.log(`ENV: ${cfg.get('node_env')}`)
}

bootstrap().catch((error) => {
  console.error('❌ Bootstrap error:', error)
})