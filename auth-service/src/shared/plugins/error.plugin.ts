import Elysia from 'elysia'
import { AppError } from "../errors"

export const errorPlugins = new Elysia({ name: 'error-plugin' })
  .onError(({ error, code, set }) => {
    // Твои typed errors
    if (error instanceof AppError) {
      set.status = error.statusCode
      return error.toJSON()
    }

    // Elysia validation errors (TypeBox)
    if (code === 'VALIDATION') {
      set.status = 422
      return {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 422,
        details: error.validator
      }
    }
    // NOT_FOUND от самого Elysia (несуществующий route)
    if (code === 'NOT_FOUND') {
      set.status = 404
      return { 
        error: 'Route not found', 
        code: 'NOT_FOUND', 
        statusCode: 404, 
        details: error 
      }
    }
    // Всё остальное — 500
    console.error('[Unhandled]', error)
    set.status = 500
    return { 
      error: 'Internal server error', 
      code: 'INTERNAL_ERROR', 
      statusCode: 500
    }
  })