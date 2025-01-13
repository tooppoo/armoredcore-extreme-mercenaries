
type Loggable = string | ({ message: string } & { [key: string]: unknown })
export type LogLevel = 'info' | 'debug' | 'error'

export function log(level: LogLevel, data: Loggable): void {
  if (isLowThanLogLevel(level)) {
    return
  }
  if (typeof data === 'string') {
    console[level]({ level, message: data })
  }
  else {
    console[level]({ level, ...data })
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
