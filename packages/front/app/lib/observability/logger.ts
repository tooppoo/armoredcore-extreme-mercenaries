type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const redact = (obj: Record<string, unknown>) => {
  const clone: Record<string, unknown> = { ...obj }
  const redactKeys = [
    'token',
    'authorization',
    'password',
    'secret',
    'discord_bot_token',
    'discord_public_key',
  ]
  for (const k of Object.keys(clone)) {
    if (redactKeys.includes(k.toLowerCase())) clone[k] = '[REDACTED]'
  }
  return clone
}

const emit = (
  level: LogLevel,
  message: string,
  context: Record<string, unknown> = {},
) => {
  const payload = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...redact(context),
  }
  console.log(JSON.stringify(payload))
}

export const logger = {
  debug: (message: string, context: Record<string, unknown> = {}) =>
    emit('debug', message, context),
  info: (message: string, context: Record<string, unknown> = {}) =>
    emit('info', message, context),
  warn: (message: string, context: Record<string, unknown> = {}) =>
    emit('warn', message, context),
  error: (message: string, context: Record<string, unknown> = {}) =>
    emit('error', message, context),
  withCorrelation: (correlationId?: string) => ({
    debug: (message: string, context: Record<string, unknown> = {}) =>
      emit('debug', message, { correlationId, ...context }),
    info: (message: string, context: Record<string, unknown> = {}) =>
      emit('info', message, { correlationId, ...context }),
    warn: (message: string, context: Record<string, unknown> = {}) =>
      emit('warn', message, { correlationId, ...context }),
    error: (message: string, context: Record<string, unknown> = {}) =>
      emit('error', message, { correlationId, ...context }),
  }),
}
