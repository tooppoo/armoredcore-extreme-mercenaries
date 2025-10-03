import { getDB } from '../../../app/db/driver.server'
import { buildVideoArchiveFromUrl } from '../../../app/lib/archives/video/upload/functions.server'
import { getOgpStrategyProvider } from '../../../app/lib/archives/common/ogp/get-strategy.provider.server'
import { findVideoArchiveByURL } from '../../../app/lib/archives/video/upload/repository/find-video-archive-by-url'
import { saveVideoArchive } from '../../../app/lib/archives/video/upload/repository/save-video-archive.server'
import { overrideArchiveContents } from '../../../app/lib/archives/video/upload/override-archive-contents.server'

import {
  buildChallengeArchiveFromText,
  buildChallengeArchiveFromUrl,
} from '../../../app/lib/archives/challenge/upload/functions.server'
import { findChallengeArchiveByURL } from '../../../app/lib/archives/challenge/upload/repository/find-challenge-archive-by-url'
import { saveChallengeArchive } from '../../../app/lib/archives/challenge/upload/repository/save-challenge-archive.server'

import {
  duplicatedUrl,
  failedGetOGP,
  unsupportedUrl,
  type ArchiveError,
} from '../../../app/lib/archives/common/errors.server'

export type UpsertResult =
  | { ok: true }
  | { ok: false; code: 'duplicate' | 'unsupported' | 'ogp_fetch_failed' | 'unexpected' }

export async function upsertVideo(
  args: {
    url: string
    title?: string
    description?: string
    user: { id: string; name: string }
  },
  env: Env,
): Promise<UpsertResult> {
  try {
    const db = getDB(env)
    const normalized = new URL(args.url)
    const contents = await buildVideoArchiveFromUrl(normalized, {
      env,
      getOGPStrategy: getOgpStrategyProvider(env),
      findArchiveByURL: findVideoArchiveByURL(db),
    })
    const finalContents = overrideArchiveContents(contents, {
      title: args.title,
      description: args.description,
    })
    await saveVideoArchive(
      {
        contents: finalContents,
        uploader: { id: args.user.id, name: args.user.name },
      },
      db,
    )
    return { ok: true }
  } catch (e: any) {
    const err = e as ArchiveError
    switch (err?.code) {
      case duplicatedUrl:
        return { ok: false, code: 'duplicate' }
      case unsupportedUrl:
        return { ok: false, code: 'unsupported' }
      case failedGetOGP:
        return { ok: false, code: 'ogp_fetch_failed' }
      default:
        return { ok: false, code: 'unexpected' }
    }
  }
}

export async function upsertChallenge(
  args:
    | {
        type: 'link'
        url: string
        title: string
        description?: string
        user: { id: string; name: string }
      }
    | {
        type: 'text'
        title: string
        text: string
        user: { id: string; name: string }
      },
  env: Env,
): Promise<UpsertResult> {
  try {
    const db = getDB(env)
    const contents = await (async () => {
      if (args.type === 'text') {
        return buildChallengeArchiveFromText({ title: args.title, text: args.text })
      }
      return buildChallengeArchiveFromUrl(
        { title: args.title, url: args.url, description: args.description },
        {
          env,
          getOGPStrategy: getOgpStrategyProvider(env),
          findArchiveByURL: findChallengeArchiveByURL(db),
        },
      )
    })()
    await saveChallengeArchive(
      {
        contents,
        uploader: { id: args.user.id, name: args.user.name },
      },
      db,
    )
    return { ok: true }
  } catch (e: any) {
    const err = e as ArchiveError
    switch (err?.code) {
      case duplicatedUrl:
        return { ok: false, code: 'duplicate' }
      case unsupportedUrl:
        return { ok: false, code: 'unsupported' }
      case failedGetOGP:
        return { ok: false, code: 'ogp_fetch_failed' }
      default:
        return { ok: false, code: 'unexpected' }
    }
  }
}

