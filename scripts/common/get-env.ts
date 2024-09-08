import fs from "fs";
import {distPath} from "./dist-path.ts";

export type Env = Record<string, string>

export function getEnv(file: string): Env {
  const envFile = distPath(file)
  const env: string = fs.readFileSync(envFile).toString('utf-8')

  return env.split('\n').reduce(
    (acc, line): Env => {
      if (/^\s*#.*$/.test(line)) return acc

      const [k, v] = line.split('=')

      return k ? { ...acc, [k]: v } : acc
    },
    {} as Env
  )
}