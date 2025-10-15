import type { ErrorCode } from './errors'
import { messageFor } from './errors'

type Option = { name: string; type: number; value?: string }

export type ValidationOk<T> = { ok: true; data: T }
export type ValidationErr = { ok: false; code: ErrorCode; message: string }
export type Validation<T> = ValidationOk<T> | ValidationErr

const find = (opts: Option[] | undefined, name: string) =>
  opts?.find((o) => o?.name === name)?.value

const isNonEmpty = (s: unknown): s is string =>
  typeof s === 'string' && s.trim().length > 0

export function validateVideoCommand(options?: Option[]): Validation<{
  url: string
  title?: string
  description?: string
}> {
  const url = find(options, 'url')
  const title = find(options, 'title')
  const description = find(options, 'description')

  if (!isNonEmpty(url)) {
    return {
      ok: false,
      code: 'missing_required_field',
      message: messageFor('missing_required_field'),
    }
  }
  try {
    new URL(url)
  } catch {
    return {
      ok: false,
      code: 'invalid_url',
      message: messageFor('invalid_url'),
    }
  }
  return { ok: true, data: { url, title, description } }
}

export function validateChallengeCommand(
  options?: Option[],
): Validation<
  | { kind: 'link'; title: string; url: string; description?: string }
  | { kind: 'text'; title: string; text: string }
> {
  const title = find(options, 'title')
  const url = find(options, 'url')
  const description = find(options, 'description')

  if (!isNonEmpty(title)) {
    return {
      ok: false,
      code: 'missing_required_field',
      message: messageFor('missing_required_field'),
    }
  }

  if (isNonEmpty(url)) {
    try {
      new URL(String(url))
    } catch {
      return {
        ok: false,
        code: 'invalid_url',
        message: messageFor('invalid_url'),
      }
    }
    return { ok: true, data: { kind: 'link', title, url, description } }
  }

  const text = description ?? ''
  return { ok: true, data: { kind: 'text', title, text } }
}
