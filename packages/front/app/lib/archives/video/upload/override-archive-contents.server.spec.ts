import { describe, expect, it } from 'vitest'
import { overrideArchiveContents } from './override-archive-contents.server'
import { type ArchiveContents } from '~/lib/archives/video/upload/entity.server'

const createSampleArchive = (): ArchiveContents => ({
  externalId: 'external-id',
  title: 'original title',
  description: 'original description',
  imageUrl: new URL('https://example.com/image.jpg'),
  url: new URL('https://example.com/video'),
})

describe('overrideArchiveContents', () => {
  it('returns original archive when overrides are not provided', () => {
    const archive = createSampleArchive()

    const result = overrideArchiveContents(archive, {})

    expect(result).toBe(archive)
  })

  it('overrides title when provided', () => {
    const archive = createSampleArchive()

    const result = overrideArchiveContents(archive, {
      title: 'custom title',
    })

    expect(result).toMatchObject({
      title: 'custom title',
      description: archive.description,
    })
  })

  it('overrides description when provided', () => {
    const archive = createSampleArchive()

    const result = overrideArchiveContents(archive, {
      description: 'custom description',
    })

    expect(result).toMatchObject({
      title: archive.title,
      description: 'custom description',
    })
  })

  it('overrides both title and description when both are provided', () => {
    const archive = createSampleArchive()

    const result = overrideArchiveContents(archive, {
      title: 'custom title',
      description: 'custom description',
    })

    expect(result).toMatchObject({
      title: 'custom title',
      description: 'custom description',
    })
  })
})
