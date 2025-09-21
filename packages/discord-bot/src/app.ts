import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { log } from './lib/log.js'
import { startBot } from './bot/bot.js'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Alive')
})
app.use(logger())

serve(
  {
    fetch: app.fetch,
    port: process.env.PORT ? Number(process.env.PORT) : 3000,
  },
  (({ port }) => {
    if (process.env.ENV === 'local') {
      log('debug', `Server running on http://localhost:${port}`)
    }

    startBot()

    log('info', 'Starting Discord Bot...')
  }),
)

export default app
