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
  
  // Clear all records to avoid duplicate constraints before seeding
  execSync(
    `${frontCommand} -- sql:test -- --file ${path.join(__dirname, 'global.setup.cleanup.sql')}`,
  )
  
  // Seed test DB with local seed data
  const seedDir = path.resolve(repoRoot, 'packages/front/app/db/seeds/local')
  execSync(`ls -la ${seedDir}`, { stdio: 'inherit' })
  
  const seedFiles = ['01_discord_members.sql', '02_video_archives.sql', '03_challenge_archives.sql']
  for (const file of seedFiles) {
    const seedPath = path.join(seedDir, file)
    console.log(`Seeding: ${seedPath}`)
    execSync(`${frontCommand} -- sql:test -- --file ${seedPath}`)
  }
})
