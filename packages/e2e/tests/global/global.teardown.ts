import { test as teardown } from '@playwright/test'
import { execSync } from 'child_process'

teardown('setup db', async () => {
  const frontCommand = 'npm run --prefix ../../ front'
  execSync(
    `${frontCommand} -- db-execute:test -- --file ${__dirname}/global.setup.cleanup.sql`,
  )
})
