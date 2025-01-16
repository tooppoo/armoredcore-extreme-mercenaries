import sanitizeHtml from 'sanitize-html';

type Sanitize = (s: string) => string

export const htmlSanitize: Sanitize = sanitizeHtml
export const h: Sanitize = htmlSanitize
