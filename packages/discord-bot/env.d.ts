import { LogLevel } from './lib/log'

declare module 'process' {
	global {
		namespace NodeJS {
			interface ProcessEnv {
        readonly DISCORD_TOKEN: string

        readonly ARCHIVE_CHANNEL: string

        readonly FRONT_URL: string
        readonly FRONT_AUTH_UPLOAD_ARCHIVE: string

        readonly LOG_LEVEL?: string
			}
		}
	}
}