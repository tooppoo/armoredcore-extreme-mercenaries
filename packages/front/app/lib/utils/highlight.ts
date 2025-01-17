import hljs from 'highlight.js/lib/core';
import _diff from 'highlight.js/lib/languages/diff';

hljs.registerLanguage('diff', _diff);

export const diff = (src: string) => hljs.highlight(src, { language: 'diff' }).value
