
import { argv, $ } from 'zx'
import { require } from './common/require.ts';
import { distPath } from './common/dist-path.ts';

$.verbose = true

function main(): void {
  const id = require(argv._[0], 'should specify id as 1st argument');
  const title = require(argv._[1], 'should specify title as 2nd argument');

  const fileName = `${id}.md`
  const body = template(title)
  const dist = distPath('docs', fileName)

  $`echo ${body} > ${dist}`
}

function template(title: string): string {
  return `---
# metadata for jekyll
layout: default
title: ${title}
---

# ${title}
`
}

main();
