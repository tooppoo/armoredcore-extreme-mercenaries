import { execSync } from 'node:child_process'
import fs from 'node:fs'

const seedFiles = fs
  .readdirSync(`${import.meta.dirname}`, { encoding: 'utf-8' })
  .filter((file) => file.endsWith('.sql'))

seedFiles.forEach((file) => {
  const frontCommand = 'pnpm --dir ../../ --filter @ac-extreme-mercenaries/front run'
  const cmd = `${frontCommand} sql -- --file="${resolve(file)}"`
  console.log(`Run: ${file}`)
  execSync(cmd)
})

function resolve(file: string) {
  return `${import.meta.dirname}/${file}`
}
