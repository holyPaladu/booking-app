type Handler<T = unknown> = (payload: T) => Promise<void> | void

interface EventBus {
  emit<T>(event: string, payload: T): Promise<void>
  on<T>(event: string, handler: Handler<T>): void
  off<T>(event: string, handler: Handler<T>): void
}

export const createEventBus = (): EventBus => {
  const listeners = new Map<string, Set<Handler>>()

  return {
    on<T>(event: string, handler: Handler<T>) {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(handler as Handler)
    },

    off<T>(event: string, handler: Handler<T>) {
      listeners.get(event)?.delete(handler as Handler)
    },

    async emit<T>(event: string, payload: T) {
      const handlers = listeners.get(event)
      if (!handlers?.size) return

      // fire-and-forget: не блокируем вызывающий код
      // ошибки логируем, но не пробрасываем в authService
      await Promise.allSettled(
        [...handlers].map(h =>
          Promise.resolve(h(payload)).catch(err =>
            console.error(`[EventBus] handler error on "${event}":`, err)
          )
        )
      )
    }
  }
}

// singleton для in-process использования
export const eventBus = createEventBus()
export type { EventBus }