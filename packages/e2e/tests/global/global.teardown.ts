import { test as teardown } from '@playwright/test'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

teardown('setup db', async () => {
  const repoRoot = path.resolve(__dirname, '../../../../')
  const repoDirFlag = JSON.stringify(repoRoot)
  const frontCommand = `pnpm --dir ${repoDirFlag} --filter @ac-extreme-mercenaries/front run`
  execSync(
    `${frontCommand} sql:test -- --file ${__dirname}/global.setup.cleanup.sql`,
  )
})
