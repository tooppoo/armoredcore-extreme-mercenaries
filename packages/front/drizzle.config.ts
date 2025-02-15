import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './app/db/schema.server.ts',
  out: './app/db/migrations',
})
