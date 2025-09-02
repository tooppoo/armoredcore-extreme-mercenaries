import sanitizeHtml from 'sanitize-html'

type Sanitize = (s: string) => string

/*
 * sanitizeHtml.defaults はECMAScriptの export defaults によるものではなく
 * sanitizeHtmlオブジェクトのdefaultsプロパティ
 */

export const htmlSanitize: Sanitize = (s) =>
  sanitizeHtml(s, {
    allowedAttributes: sanitizeHtml.defaults.allowedTags.reduce(
      (acc, tag) => ({
        ...acc,
        [tag]: [
          'class',
          'style',

          ...(sanitizeHtml.defaults.allowedAttributes[tag] || []).map((attr) =>
            attr.toString(),
          ),
        ],
      }),
      {} as Record<string, string[]>,
    ),
  })
export const h: Sanitize = htmlSanitize
