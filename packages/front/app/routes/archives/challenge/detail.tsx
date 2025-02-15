import { useLoaderData } from 'react-router'
import React from 'react'
import { type ReadArchive } from '~/lib/archives/challenge/read/entity'
import { buildMeta, unofficialServer } from '~/lib/head/build-meta'
import { Margin } from '~/lib/utils/components/spacer'
import type { Route } from './+types/detail'
import { findChallengeArchiveByExternalId } from '~/lib/archives/challenge/read/repository/find-challenge-by-external-id'
import { notFound } from '~/lib/api/response/json/error.server'
import { Description } from '~/lib/archives/common/components/description'

type LoadDetail = Readonly<{
  archive: ReadArchive
}>
export const loader = async ({ params, context }: Route.LoaderArgs) => {
  return findChallengeArchiveByExternalId(params.externalId, context.db).then(
    (archive) => {
      if (!archive) {
        throw notFound(null)
      }

      return Response.json({
        archive,
      })
    },
  )
}

// クエリ用なので略記名
const ChallengeArchives: React.FC = () => {
  const { archive } = useLoaderData<LoadDetail>()

  return (
    <>
      <h2>{archive.title}</h2>

      <Margin h={32} />

      <section>
        <h3>説明</h3>
        <hr className="w-1/3 mb-6" />
        <Description description={archive.description} />
      </section>
      <Margin h={32} />
      <section>
        <h3>出典</h3>
        <hr className="w-1/3 mb-6" />
        {archive.url ? (
          <a href={archive.url} target="_blank" rel="noopener noreferrer">
            {archive.url}
          </a>
        ) : (
          '無し'
        )}
      </section>
      <Margin h={32} />
    </>
  )
}

export const meta: Route.MetaFunction = ({ location }) => [
  ...buildMeta({
    title: 'チャレンジアーカイブ',
    description: [
      `${unofficialServer}で登録された、各チャレンジ情報のアーカイブです。`,
      `チャレンジの詳細情報を掲載しています。`,
    ].join(''),
    pathname: location.pathname,
  }),
]

export default ChallengeArchives
