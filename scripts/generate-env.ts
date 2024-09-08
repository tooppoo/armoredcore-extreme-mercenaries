import {getEnv, type Env } from "./common/get-env.ts";
import {distPath} from "./common/dist-path.ts";
import { $ } from 'zx'

$.verbose = true

function main() {
  const envExampleFile: string = distPath('.env.example')
  const envFile = distPath('.env')

  const template = getEnv(envExampleFile)
  const keyValues = Object.keys(template).reduce(
    (acc, k) => ({
      ...acc,
      [k]: process.env[k],
    }),
    {}
  )

  const body = formatEnv(keyValues)

  $`echo ${body} > ${envFile}`
}

function formatEnv(env: Env): string {
  const lines = Object.entries(env).reduce(
    (acc, [key, value]) => [...acc, `${key}=${value}`],
    []
  )

  return lines.join('\n')
}

main()
