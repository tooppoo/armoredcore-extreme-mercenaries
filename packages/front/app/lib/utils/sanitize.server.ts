import sanitizeHtml from 'sanitize-html'

type Sanitize = (s: string) => string

/*
 * sanitizeHtml.defaults はECMAScriptの export defaults によるものではなく
 * sanitizeHtmlオブジェクトのdefaultsプロパティ
 */

export const htmlSanitize: Sanitize = (s) =>
  sanitizeHtml(s, {
    // eslint-disable-next-line import/no-named-as-default-member
    allowedAttributes: sanitizeHtml.defaults.allowedTags.reduce(
      (acc, tag) => ({
        ...acc,
        [tag]: [
          'class',
          'style',
          // eslint-disable-next-line import/no-named-as-default-member
          ...(sanitizeHtml.defaults.allowedAttributes[tag] || []).map((attr) =>
            attr.toString(),
          ),
        ],
      }),
      {} as Record<string, string[]>,
    ),
  })
export const h: Sanitize = htmlSanitize
