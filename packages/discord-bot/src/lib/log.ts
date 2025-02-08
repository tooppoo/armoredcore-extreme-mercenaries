
type Loggable = string | ({ message: string } & { [key: string]: unknown })
export type LogLevel = 'info' | 'debug' | 'error'

export function log(level: LogLevel, data: Loggable): void {
  if (isLowThanLogLevel(level)) {
    return
  }

  console.log(toMessage(level, data))
}
function toMessage(level: string, data: Loggable): string {
  if (typeof data === 'string') {
    return JSON.stringify({ level, message: data, time: new Date().toISOString() })
  }
  else {
    return JSON.stringify({ level, ...data, time: new Date().toISOString() })
  }
}
function isLowThanLogLevel(level: LogLevel): boolean {
  const currentLogLevel = logLevel[process.env.LOG_LEVEL || 'info'] || logLevel['info']

  return logLevel[level] < currentLogLevel
}

const logLevel: Record<string, number> = {
  debug: 0,
  info: 1,
  error: 2,
} satisfies Record<LogLevel, number>
