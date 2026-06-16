import { type EventBus, type UserRegisteredPayload, EVENTS } from "../shared/event-bus"
import { authService } from "./auth.service"

type HandlerDeps = {
  svc: ReturnType<typeof authService>
}

export const authEvent = (event: EventBus, deps: HandlerDeps): void => {
  event.on<UserRegisteredPayload>(EVENTS.AUTH.USER_REGISTERED, async (dto) => {
    await deps.svc.afterRegisterEvent(dto)
  })
}