import fs from 'fs'
import {getEnv} from "./common/get-env.ts";
import {$} from 'zx'
import {distPath} from "./common/dist-path.ts";

$.verbose = true

function main() {
  const env = getEnv('.env')

  const configFile = distPath('_config.yml')
  const config = fs.readFileSync(configFile).toString('utf-8')

  const replaced = Object.entries(env).reduce(
    (result, [key, value]) => {
      const pattern = new RegExp(`{{ *env.${key} *}}`, 'g')

      return result.replaceAll(pattern, value)
    },
    config
  )

  $`echo ${replaced} > ${configFile}`
}

main()
