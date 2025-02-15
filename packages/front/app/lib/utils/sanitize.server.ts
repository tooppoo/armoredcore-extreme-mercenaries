import sanitizeHtml, { defaults } from 'sanitize-html'

type Sanitize = (s: string) => string

export const htmlSanitize: Sanitize = (s) =>
  sanitizeHtml(s, {
    allowedAttributes: defaults.allowedTags.reduce(
      (acc, tag) => ({
        ...acc,
        [tag]: [
          'class',
          'style',
          ...(defaults.allowedAttributes[tag] || []).map((attr) =>
            attr.toString(),
          ),
        ],
      }),
      {} as Record<string, string[]>,
    ),
  })
export const h: Sanitize = htmlSanitize
