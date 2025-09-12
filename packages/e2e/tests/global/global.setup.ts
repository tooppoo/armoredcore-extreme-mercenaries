import { test as setup } from '@playwright/test'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

setup('setup db', async () => {
  const repoRoot = path.resolve(__dirname, '../../../../')
  const frontCommand = `npm run --prefix ${repoRoot} front`
  // Apply migrations
  execSync(`${frontCommand} -- migration:test`)
  // Ensure clean DB state before all tests (avoid cross-project duplicates)
  execSync(
    `${frontCommand} -- sql:test -- --file ${path.join(__dirname, 'global.setup.cleanup.sql')}`,
  )
})
