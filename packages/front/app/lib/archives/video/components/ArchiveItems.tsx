import React from 'react'
import { WithChildren } from '~/lib/utils/components/types'
import { Description } from '~/lib/archives/common/components/description'

export type ArchiveItemProps = Readonly<{
  title: string
  description: string
  imageUrl: string
  url: string
  createdAt: Date
}>

type SourceKey = 'yt' | 'x' | 'nico' | 'unknown'

function getArchiveMeta(url: string, createdAt: Date) {
  const hostname = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return ''
    }
  })()
  const source: SourceKey = (() => {
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be'))
      return 'yt'
    if (hostname.includes('x.com') || hostname.includes('twitter.com'))
      return 'x'
    if (hostname.includes('nicovideo.jp') || hostname.includes('nico.ms'))
      return 'nico'
    return 'unknown'
  })()
  const created = (() => {
    try {
      const d = new Date(createdAt)
      return d.toLocaleDateString('ja-JP')
    } catch {
      return ''
    }
  })()
  return { hostname, source, created }
}

function sourceLabelText(source: SourceKey): string {
  switch (source) {
    case 'yt':
      return 'YouTube'
    case 'x':
      return 'X/Twitter'
    case 'nico':
      return 'ニコニコ動画'
    default:
      return ''
  }
}

export const ArchiveCardItem: React.FC<ArchiveItemProps> = ({
  title,
  description,
  imageUrl,
  url,
  createdAt,
}) => {
  const { source, created } = getArchiveMeta(url, createdAt)
  const label = sourceLabelText(source)
  return (
    <a
      href={url}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
      className="archive-item rounded-md overflow-hidden flex flex-col ac-border ac-hover no-underline"
      aria-label={title}
    >
      <div className="p-3 flex items-center justify-between text-xs">
        {label && (
          <span className="rounded-sm px-2 py-0.5 ac-border text-gray-700 dark:text-gray-200 text-sm font-medium">
            {label}
          </span>
        )}
        <span aria-label="登録日" className="text-gray-500">
          {created}
        </span>
      </div>
      <div className="bg-black/5 dark:bg-white/5 aspect-video w-full overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3 flex flex-col gap-2">
        <ArchiveItemCaption>
          <span className="underline">{title}</span>
        </ArchiveItemCaption>
        <ArchiveItemDescription>
          <Description description={description} />
        </ArchiveItemDescription>
      </div>
    </a>
  )
}

const ArchiveItemCaption: React.FC<WithChildren> = ({ children }) => (
  <div
    className={`min-h-12 line-clamp-2 overflow-hidden whitespace-normal text-ellipsis font-medium`}
  >
    {children}
  </div>
)

const ArchiveItemDescription: React.FC<WithChildren> = ({ children }) => (
  <div
    className={`min-h-16 line-clamp-3 overflow-hidden whitespace-normal text-ellipsis text-sm text-white`}
  >
    {children}
  </div>
)

type ArchiveListItemProps = ArchiveItemProps
export const ArchiveListItem: React.FC<ArchiveListItemProps> = ({
  title,
  description,
  imageUrl,
  url,
  createdAt,
}) => {
  const { source, created } = getArchiveMeta(url, createdAt)
  const label = sourceLabelText(source)
  return (
    <a
      href={url}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 items-start p-2 ac-border rounded-md ac-hover no-underline"
      aria-label={title}
    >
      <div className="w-28 shrink-0 aspect-video overflow-hidden rounded-sm bg-black/5 dark:bg-white/5">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs mb-1">
          {label && (
            <span className="rounded-sm px-2 py-0.5 ac-border text-gray-700 dark:text-gray-200 text-sm font-medium">
              {label}
            </span>
          )}
          <span className="text-gray-500">{created}</span>
        </div>
        <div className="font-medium line-clamp-2 underline">{title}</div>
        <div className="text-sm line-clamp-2 text-white">
          <Description description={description} />
        </div>
      </div>
    </a>
  )
}