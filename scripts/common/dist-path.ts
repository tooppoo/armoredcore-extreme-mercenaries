import { fileURLToPath } from 'url'
import path from 'path'

type Target =
  | 'docs'
  | '_posts'
export function distPath(target: Target, fileName: string): string {
  const here = fileURLToPath(import.meta.url)
  const dir = path.dirname(here)

  return path.resolve(dir, '..', target, fileName)
}

