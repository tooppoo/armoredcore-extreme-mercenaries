import React from 'react'
import { Link } from 'react-router'
import { WithChildren, WithClassName } from '~/lib/utils/components/types'
import { Description } from '~/lib/archives/common/components/description'

export const ArchiveTable: React.FC<WithChildren & WithClassName> = ({
  children,
  className,
}) => (
  <table className={'table-fixed ' + (className || '')}>
    <thead className="h-20">
      <tr>
        <th className="w-3/12 border-b dark:border-b-gray-300">タイトル</th>
        <th className="w-6/12 border-b dark:border-b-gray-300">説明</th>
        <th className="w-3/12 border-b dark:border-b-gray-300">出典</th>
      </tr>
    </thead>
    <tbody>{children}</tbody>
  </table>
)

type ArchiveRowProps = Readonly<{
  id: string
  title: string
  description: string
  url: string | null
  showDetailLink?: boolean
}>

export const ArchiveRow: React.FC<ArchiveRowProps> = ({
  id,
  title,
  description,
  url,
  showDetailLink = true,
}) => {
  return (
    <tr className="h-36 border-b dark:border-b-gray-300">
      <td className="text-center">
        <div
          className={`m-auto h-12 line-clamp-2 overflow-hidden whitespace-normal text-ellipsis`}
        >
          {showDetailLink ? (
            <Link to={`/archives/challenge/${id}`}>{title}</Link>
          ) : (
            title
          )}
        </div>
      </td>
      <td>
        <Description
          description={description}
          className={`m-auto h-24 w-11/12 line-clamp-4 overflow-hidden whitespace-normal text-ellipsis`}
        />
      </td>
      <td className="text-center">
        {url ? (
          <a
            href={url}
            title={title}
            target="_blank"
            rel="noopener noreferrer"
            className={`line-clamp-1 overflow-hidden whitespace-normal text-ellipsis`}
          >
            {url}
          </a>
        ) : (
          '無し'
        )}
      </td>
    </tr>
  )
}
