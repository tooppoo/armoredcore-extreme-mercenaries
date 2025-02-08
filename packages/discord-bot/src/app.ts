import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { startBot } from './bot/bot'
import { log } from './lib/log'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Alive')
})

serve(
  {
    fetch: app.fetch,
    port: parseInt(process.env.PORT || '3000', 10)
  },
  ({ port }) => {
    if (process.env.ENV === 'local') {
      log('info', `Server is running on http://localhost:${port}`)
      log('info', `LOG_LEVEL: ${process.env.LOG_LEVEL}`)
    }

    startBot()
  }
)
