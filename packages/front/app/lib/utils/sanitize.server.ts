import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

const purify = createDOMPurify(new JSDOM('').window)

export const htmlSanitize = (s: string) => purify.sanitize(s)
export const h = htmlSanitize
