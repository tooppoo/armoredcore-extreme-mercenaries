import { test as setup } from '@playwright/test'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

setup('setup db', async () => {
  const repoRoot = path.resolve(__dirname, '../../../../')
  const frontCommand = `npm run --prefix ${repoRoot} front`

  console.log('=== E2E Database Setup with Seed Data ===')
  console.log(`Repository root: ${repoRoot}`)
  console.log(`Front command: ${frontCommand}`)

  try {
    // Apply migrations
    console.log('Applying migrations...')
    execSync(`${frontCommand} -- migration:test`, { stdio: 'inherit' })

    // Check what tables exist after migration
    console.log('Checking existing tables...')
    execSync(
      `${frontCommand} -- sql:test -- --command "SELECT name FROM sqlite_master WHERE type='table';"`,
      {
        stdio: 'inherit',
      },
    )

    // Clear all records to avoid duplicate constraints before seeding
    console.log('Clearing existing records...')
    try {
      execSync(
        `${frontCommand} -- sql:test -- --file ${path.join(__dirname, 'global.setup.cleanup.sql')}`,
        { stdio: 'inherit' },
      )
    } catch (cleanupError) {
      console.log(
        'Cleanup failed (tables might not exist yet), continuing with seeding...',
      )
      console.error('Cleanup error:', cleanupError)
    }

    // Seed test DB with local seed data
    const seedDir = path.resolve(repoRoot, 'packages/front/app/db/seeds/local')
    console.log(`Seed directory: ${seedDir}`)

    if (!fs.existsSync(seedDir)) {
      throw new Error(`Seed directory not found: ${seedDir}`)
    }

    // ディレクトリから .sql を動的取得（ソートで投入順を安定化）
    const seedFiles = fs
      .readdirSync(seedDir)
      .filter((file) => file.endsWith('.sql'))
      .sort()
    console.log('Seed files:', seedFiles)
    for (const file of seedFiles) {
      const seedPath = path.join(seedDir, file)
      console.log(`Seeding: ${seedPath}`)
      execSync(`${frontCommand} -- sql:test -- --file "${seedPath}"`, {
        stdio: 'inherit',
      })
    }

    // Verify data was inserted
    console.log('Verifying seed data...')
    execSync(
      `${frontCommand} -- sql:test -- --command "SELECT COUNT(*) as video_count FROM video_archives;"`,
      { stdio: 'inherit' },
    )
    execSync(
      `${frontCommand} -- sql:test -- --command "SELECT COUNT(*) as challenge_count FROM challenge_archives;"`,
      { stdio: 'inherit' },
    )

    console.log('=== Database setup complete ===')
  } catch (error) {
    console.error('Database setup failed:', error)
    throw error
  }
})
