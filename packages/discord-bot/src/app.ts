import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { startBot } from './bot/bot'

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
      console.log(`Server is running on http://localhost:${port}`)
    }

    startBot()
  }
)
