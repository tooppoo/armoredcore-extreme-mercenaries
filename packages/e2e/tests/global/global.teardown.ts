import { test as teardown } from '@playwright/test'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

teardown('setup db', async () => {
  const frontCommand = 'npm run --prefix ../../ front'
  execSync(
    `${frontCommand} -- sql:test -- --file ${__dirname}/global.setup.cleanup.sql`,
  )
})
