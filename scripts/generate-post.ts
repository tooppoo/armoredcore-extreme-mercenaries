
import { argv, $ } from 'zx'
import { formatInTimeZone } from 'date-fns-tz'
import { require } from './common/require.ts';
import { distPath } from './common/dist-path.ts';

$.verbose = true

function main(): void {
  const id = require(argv._[0], 'should specify id as 1st argument');
  const title = require(argv._[1], 'should specify title as 2nd argument');
  const ymd = formatInTimeZone(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');

  const fileName = `${ymd}-${id}.md`
  const body = template(title)
  const dist = distPath('_posts', fileName)

  $`echo ${body} > ${dist}`
}

function template(title: string): string {
  return `---
# metadata for jekyll
layout: default
title: ${title}
# tags: 
# categories: 
---

# ${title}

write body here
`
}

main();
