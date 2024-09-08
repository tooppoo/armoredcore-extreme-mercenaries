
import {distPath} from "./common/dist-path.ts";
import fs from 'fs'
import { $ } from 'zx'

$.verbose = true

function main() {
  const env = getEnv('.env')

  const configFile = distPath('_config.yml')
  const config: string = fs.readFileSync(configFile).toString('utf-8')

  const replaced = Object.entries(env).reduce(
    (result: string, [key, value]) => {
      const pattern = new RegExp(`\{\{ *env\.${key} *\}\}`, 'g')

      return result.replaceAll(pattern, value)
    },
    config
  )

  console.debug({ configFile, env })

  $`echo ${replaced} > ${configFile}`
}

type Env = Record<string, string>
function getEnv(file: string): Env {
  const envFile = distPath(file)
  const env: string = fs.readFileSync(envFile).toString('utf-8')

  return env.split('\n').reduce(
    (acc, line) => {
      const [k, v] = line.split('=')

      return { ...acc, [k]: v }
    },
    {}
  )
}

main()
