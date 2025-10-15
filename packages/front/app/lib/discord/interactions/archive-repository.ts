import { getDB } from '../../../db/driver.server'
import { buildVideoArchiveFromUrl } from '../../archives/video/upload/functions.server'
import { getOgpStrategyProvider } from '../../archives/common/ogp/get-strategy.provider.server'
import { findVideoArchiveByURL } from '../../archives/video/upload/repository/find-video-archive-by-url'
import { saveVideoArchive } from '../../archives/video/upload/repository/save-video-archive.server'
import { overrideArchiveContents } from '../../archives/video/upload/override-archive-contents.server'

import {
  buildChallengeArchiveFromUrl,
} from '../../archives/challenge/upload/functions.server'
import { findChallengeArchiveByURL } from '../../archives/challenge/upload/repository/find-challenge-archive-by-url'
import { saveChallengeArchive } from '../../archives/challenge/upload/repository/save-challenge-archive.server'

import {
  duplicatedUrl,
  failedGetOGP,
  unsupportedUrl,
  type ArchiveError,
} from '../../archives/common/errors.server'

declare const discordUserIdBrand: unique symbol
declare const discordDisplayNameBrand: unique symbol

export type DiscordUserId = string & {
  readonly [discordUserIdBrand]: 'DiscordUserId'
}
export type DiscordDisplayName = string & {
  readonly [discordDisplayNameBrand]: 'DiscordDisplayName'
}

export type DiscordUser = { id: DiscordUserId; name: DiscordDisplayName }

export type UpsertResult =
  | { ok: true }
  | {
      ok: false
      code: 'duplicate' | 'unsupported' | 'ogp_fetch_failed' | 'unexpected'
    }

function handleArchiveError(error: unknown): UpsertResult {
  const err = error as ArchiveError
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

export async function upsertVideo(
  args: {
    url: string
    title?: string
    description?: string
    user: DiscordUser
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
  } catch (error: unknown) {
    return handleArchiveError(error)
  }
}

export async function upsertChallenge(
  args: {
    title: string
    url: string
    description?: string
    user: DiscordUser
  },
  env: Env,
): Promise<UpsertResult> {
  try {
    const db = getDB(env)
    const contents = await buildChallengeArchiveFromUrl(
      { title: args.title, url: args.url, description: args.description },
      {
        env,
        getOGPStrategy: getOgpStrategyProvider(env),
        findArchiveByURL: findChallengeArchiveByURL(db),
      },
    )
    await saveChallengeArchive(
      {
        contents,
        uploader: { id: args.user.id, name: args.user.name },
      },
      db,
    )
    return { ok: true }
  } catch (error: unknown) {
    return handleArchiveError(error)
  }
}
