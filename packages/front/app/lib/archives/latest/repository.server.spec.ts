import { describe, it, expect, beforeAll } from 'vitest'
import { getLatestVideoArchives, getLatestChallengeArchives } from './repository.server'
import { getPlatformProxy } from 'wrangler'
import { getDB } from '~/db/driver.server'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

let db: ReturnType<typeof getDB>

function run(cmd: string) {
  // run in package root: packages/front
  execSync(cmd, { stdio: 'inherit', cwd: path.resolve(__dirname, '../../../../') })
}

beforeAll(async () => {
  // Apply migrations to test DB
  run('npm run migration:test')

  // Clear all records to avoid duplicate constraints before seeding
  run('npm run sql:test -- --file ./app/db/queries/clear-records.sql')

  // Seed test DB using existing local seed SQLs against test binding
  const seedDir = path.resolve(
    __dirname,
    '../../../../app/db/seeds/local',
  )
  const files = fs
    .readdirSync(seedDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
  for (const file of files) {
    run(`npm run sql:test -- --file ${path.join(seedDir, file)}`)
  }

  // Create platform proxy to obtain a real D1 binding from wrangler.test.toml
  const platform = await getPlatformProxy({
    configPath: path.resolve(__dirname, '../../../../wrangler.test.toml'),
    environment: 'test',
  })
  db = getDB(platform.env as unknown as Env)
}, 60_000)

describe('Latest Archives Repository (with real D1 + seeds)', () => {
  it('fetches latest video archives (default limit=3)', async () => {
    const result = await getLatestVideoArchives(db)
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    expect(result.length).toBeLessThanOrEqual(3)
    // Sorted by createdAt desc, id asc within same day
    for (let i = 1; i < result.length; i++) {
      expect(new Date(result[i - 1].createdAt) >= new Date(result[i].createdAt)).toBe(true)
    }
  })

  it('respects custom limit for video archives', async () => {
    const result = await getLatestVideoArchives(db, 2)
    expect(result.length).toBeLessThanOrEqual(2)
  })

  it('fetches latest challenge archives (default limit=3)', async () => {
    const result = await getLatestChallengeArchives(db)
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    expect(result.length).toBeLessThanOrEqual(3)
    for (let i = 1; i < result.length; i++) {
      expect(new Date(result[i - 1].createdAt) >= new Date(result[i].createdAt)).toBe(true)
    }
  })

  it('respects custom limit for challenge archives', async () => {
    const result = await getLatestChallengeArchives(db, 2)
    expect(result.length).toBeLessThanOrEqual(2)
  })
})
