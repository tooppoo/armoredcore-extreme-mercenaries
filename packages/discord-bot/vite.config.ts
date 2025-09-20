import { defineConfig } from 'vite'
import build from '@hono/vite-build/node'
import { builtinModules } from 'node:module'

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

export default defineConfig({
  server: {
    port,
  },
  plugins: [
    build({
      entry: 'src/app.ts',
      port,
      external: [
        ...builtinModules,
        ...builtinModules.map((name) => `node:${name}`),
        'discord.js',
        '@discordjs/ws',
        '@hono/node-server',
        'hono',
        'dotenv/config',
        'zlib-sync',
        'bufferutil',
        'utf-8-validate',
      ],
    }),
  ],
})
