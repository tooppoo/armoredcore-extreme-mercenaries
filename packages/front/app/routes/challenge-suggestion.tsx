import { useState } from 'react'
import { Link } from 'react-router'
import { LinkIcon } from '@heroicons/react/16/solid'
import type { Route } from './+types/challenge-suggestion'
import { buildMeta } from '~/lib/head/build-meta'
import { Spinner } from '~/lib/utils/components/loading'
import type {
  ChallengeSuggestionResponse,
  ChallengeSuggestionError,
} from '~/lib/challenge-suggestion/types'
import { LinkCard } from '~/lib/utils/components/LinkCard'

export const handle = {
  breadcrumb: 'チャレンジ提案AI',
}

export default function ChallengeSuggestion() {
  const [consultation, setConsultation] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ChallengeSuggestionResponse | null>(null)
  const [error, setError] = useState<ChallengeSuggestionError | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consultation.trim() || isLoading) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/challenge-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ consultation }),
      })

      if (!response.ok) {
        const errorData = (await response.json()) as {
          error: ChallengeSuggestionError
        }
        setError(errorData.error)
      } else {
        const data = (await response.json()) as ChallengeSuggestionResponse
        setResult(data)
      }
    } catch {
      setError({
        code: 'SERVICE_UNAVAILABLE',
        message: '通信エラーが発生しました。しばらく経ってからお試しください。',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="content-group" role="main" aria-label="チャレンジ提案AI">
      <section className="content-section" aria-labelledby="about">
        <header>
          <h2 id="about" className="section-heading">
            <span>チャレンジ提案AIについて</span>
            <Link
              to="#about"
              className="anchor-link"
              aria-label="セクション「チャレンジ提案AIについて」へのアンカーリンク"
            >
              <LinkIcon className="size-4" aria-hidden="true" />
            </Link>
          </h2>
        </header>
        <div className="content-text">
          <p>
            あなたの相談内容に応じて、アーマードコア6のチャレンジ（縛りプレイ）を提案します。
          </p>
          <p>
            使用機体やプレイスタイル、達成したい目標などを入力すると、
            過去のチャレンジアーカイブを参考にした新しいチャレンジを提案します。
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ※ 本機能はOpenAI APIを使用しています。月間利用回数に制限があります。
          </p>
        </div>
      </section>

      <section className="content-section" aria-labelledby="input">
        <header>
          <h2 id="input" className="section-heading">
            <span>相談内容を入力</span>
            <Link
              to="#input"
              className="anchor-link"
              aria-label="セクション「相談内容を入力」へのアンカーリンク"
            >
              <LinkIcon className="size-4" aria-hidden="true" />
            </Link>
          </h2>
        </header>
        <div className="content-text">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="consultation"
                className="block text-sm font-medium mb-2"
              >
                相談内容
              </label>
              <textarea
                id="consultation"
                value={consultation}
                onChange={(e) => setConsultation(e.target.value)}
                placeholder="例：軽量二脚で近接武器メインのアセンを使っています。バルテウスを倒す面白いチャレンジを教えてください。"
                className="w-full min-h-30 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={1000}
                disabled={isLoading}
                aria-describedby="consultation-hint"
              />
              <p
                id="consultation-hint"
                className="text-sm text-gray-500 dark:text-gray-400 mt-1"
              >
                使用機体、プレイスタイル、達成したい目標などを自由に入力してください（最大1000文字）
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={isLoading || !consultation.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isLoading ? '提案中...' : 'チャレンジを提案してもらう'}
              </button>
              {isLoading && <Spinner />}
            </div>
          </form>
        </div>
      </section>

      {error && (
        <section
          className="content-section"
          aria-labelledby="error"
          role="alert"
        >
          <header>
            <h2
              id="error"
              className="section-heading text-red-600 dark:text-red-400"
            >
              <span>エラー</span>
            </h2>
          </header>
          <div className="content-text">
            <p className="text-red-600 dark:text-red-400">{error.message}</p>
          </div>
        </section>
      )}

      {result && (
        <>
          <section className="content-section" aria-labelledby="suggestion">
            <header>
              <h2 id="suggestion" className="section-heading">
                <span>提案されたチャレンジ</span>
                <Link
                  to="#suggestion"
                  className="anchor-link"
                  aria-label="セクション「提案されたチャレンジ」へのアンカーリンク"
                >
                  <LinkIcon className="size-4" aria-hidden="true" />
                </Link>
              </h2>
            </header>
            <div className="content-text">
              <article className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-4">
                  {result.suggestion.title}
                </h3>
                <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 mb-4">
                  {result.suggestion.description}
                </div>
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  {result.suggestion.hashtag}
                </p>
              </article>
            </div>
          </section>

          {result.similarChallenges.length > 0 && (
            <section className="content-section" aria-labelledby="similar">
              <header>
                <h2 id="similar" className="section-heading">
                  <span>参考にした類似チャレンジ</span>
                  <Link
                    to="#similar"
                    className="anchor-link"
                    aria-label="セクション「参考にした類似チャレンジ」へのアンカーリンク"
                  >
                    <LinkIcon className="size-4" aria-hidden="true" />
                  </Link>
                </h2>
              </header>
              <div className="content-text">
                <div className="space-y-4">
                  {result.similarChallenges.map((challenge) => (
                    <article
                      key={challenge.externalId}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {challenge.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap line-clamp-3">
                        {challenge.description}
                      </p>
                      {challenge.url && (
                        <div className="mt-2">
                          <LinkCard
                            to={challenge.url}
                            type="external"
                            aria-label={`${challenge.title}の元投稿を見る（新しいタブで開く）`}
                          >
                            元投稿を見る
                          </LinkCard>
                        </div>
                      )}
                      <div className="mt-2">
                        <LinkCard
                          to={`/archives/challenge/${challenge.externalId}`}
                          type="internal"
                          aria-label={`${challenge.title}の詳細ページへ移動`}
                        >
                          詳細を見る
                        </LinkCard>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    ...buildMeta({
      title: 'チャレンジ提案AI - ARMORED CORE EXTREME MERCENARIES',
      description:
        'あなたの相談内容に応じて、アーマードコア6のチャレンジ（縛りプレイ）を提案するAI機能。使用機体やプレイスタイルを入力すると、過去のチャレンジアーカイブを参考にした新しいチャレンジを提案します。',
      pathname: location.pathname,
    }),
  ]
}
