import { join } from 'path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '~/': join(__dirname, 'app/'),
    },
  },
  test: {
    include: ['app/**/*.spec.ts'],
    coverage: {
      reporter: ['text', 'json'],
      all: true,
      include: ['app/**/*.ts'],
      exclude: ['app/**/*.spec.ts'],
      provider: 'v8',
    },
    setupFiles: ['./vitest-setup'],
  },
})
