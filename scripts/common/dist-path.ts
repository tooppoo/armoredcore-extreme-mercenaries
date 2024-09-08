import { fileURLToPath } from 'url'
import path from 'path'

export function distPath(...paths: string[]): string {
  const here = fileURLToPath(import.meta.url)
  const dir = path.dirname(here)

  return path.resolve(dir, '..', '..', ...paths)
}
