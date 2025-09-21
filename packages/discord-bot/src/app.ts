import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { startBot } from './bot/bot'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Alive')
})
app.use(logger())

startBot()

export default app
