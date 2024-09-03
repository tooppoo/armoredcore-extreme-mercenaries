
import { argv, $ } from 'zx'
import { formatInTimeZone } from 'date-fns-tz'
import path from 'path'
import { require } from './common/require.ts';
import { distPath } from './common/dist-path.ts';

$.verbose = true

function main(): void {
  const id = require(argv._[0], 'should specify id as 1st argument');
  const title = require(argv._[1], 'should specify title as 2nd argument');
  const ymd = formatInTimeZone(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');

  const fileName = `${ymd}-${id}.md`
  const body = template(title, ymd)
  const dist = distPath(path.resolve('docs', '_posts'), fileName)

  $`echo ${body} > ${dist}`
}

function template(title: string, date: string): string {
  return `---
# metadata for jekyll
layout: updates
title: "${title}"
# tags: 
# categories: 
---

# 更新履歴 - ${date}
## ${title}

write body here
`
}

main();
