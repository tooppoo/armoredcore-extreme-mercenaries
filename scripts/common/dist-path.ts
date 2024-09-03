import { fileURLToPath } from 'url'
import path from 'path'

export function distPath(target: string, fileName: string): string {
  const here = fileURLToPath(import.meta.url)
  const dir = path.dirname(here)

  return path.resolve(dir, '..', '..', target, fileName)
}

