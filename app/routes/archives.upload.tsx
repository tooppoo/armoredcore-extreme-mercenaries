import { LoaderFunction } from '@remix-run/cloudflare';
import { type SitemapFunction } from 'remix-sitemap';
import { getAuthentication } from '~/lib/auth/authentication.server';
// import { action } from './auth.discord'
import { Form } from '@remix-run/react';
import { FieldError, SubmitHandler, useForm } from 'react-hook-form';
import PropTypes from 'prop-types';
import { Margin } from '~/lib/components/utils/spacer';
import { Reducer, useReducer } from 'react';
import { ArchiveItem, ArchiveItemProps } from '../lib/components/archive/ArchiveItem'
import { OGPExtractor, withDomParser, withOGPScanner, withYoutubeAPI } from '~/lib/ogp/extractor';
import { Spinner } from '~/lib/components/utils/loading';

export const sitemap: SitemapFunction = () => ({
  exclude: true
})

export const loader: LoaderFunction = async ({ request, context }) => {
  return await getAuthentication({ context }).isAuthenticated(request, {
    failureRedirect: "/",
  });
};

const allowedUrlPattern = /^https:\/\/(www.)?(youtube.com|nicovideo.jp|x.com)\/.+/

type Inputs = Readonly<{
  archive_url: string
}>
const ArchivesUpload: React.FC = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>({ mode: 'all' })

  const [confirmState, dispatchConfirm] = useReducer(reduceConfirmState, {
    confirmed: false,
    loading: false,
    archive: null,
    error: null,
  })
  const archiveUrl = watch('archive_url')

  const isConfirmable = errors.archive_url === undefined && !!archiveUrl
  const onConfirm = () => {
    if (!isConfirmable) {
      return
    }

    dispatchConfirm({ type: 'loading' })

    fetchArchive(archiveUrl).then((archive) => {
      dispatchConfirm({ type: 'confirmed', archive })
    }).catch((error) => {
      dispatchConfirm({ type: 'error', error })
    })
  }

  const onSubmit: SubmitHandler<Inputs> = (data) => console.log({ data })

  return (
    <>
      <h2>アーカイブ送信</h2>
      <Border />
      <Form action='/archives/upload' method='post' onSubmit={handleSubmit(onSubmit)}>
        <div className='flex flex-col'>
          <label htmlFor='archive_url'>
            アーカイブURL
          </label>
          <Margin h={16} />
          <input
            id='archive_url'
            className='border rounded-md py-2 px-3'
            type="text"
            placeholder='https://www.youtube.com/..., https://www.nicovideo.com/..., https://x.com/...'
            {...register('archive_url', { required: true, pattern: allowedUrlPattern })}
          />
          <Margin h={8} />
          {errors.archive_url && ErrorView({ error: errors.archive_url })}
        </div>

        <Margin h={32} />

        <div className='flex'>
          <button
            type='button'
            className='p-1 border rounded-md w-20 bg-gray-300 text-black disabled:text-gray-400'
            onClick={onConfirm}
            disabled={!isConfirmable}
          >
            確認
          </button>
          <Margin w={16} />
          {confirmState.confirmed && <button
            type='submit'
            className='p-1 border rounded-md w-20'
          >
            送信
          </button>}
        </div>
      </Form>
      <Margin h={16} />
      <section className='max-w-80'>
        {
          confirmState.confirmed &&
          <ArchiveItem
            {...confirmState.archive}
          />
        }
        {
          confirmState.loading && <Spinner />
        }
        {
          confirmState.error && (
            <div className='text-red-500'>
              エラーが発生したため、URLを確認できませんでした<br/>
            </div>
          )
        }
      </section>
    </>
  )
}

const ErrorView: React.FC<{ error: FieldError }> = ({ error }) => {
  switch (error.type) {
    case 'pattern':
      return (<div className='text-red-500'>
        <div>以下で始まるURLのみ利用できます</div>
        <ul>
          <li>https://www.youtube.com</li>
          <li>https://www.nicovideo.jp</li>
          <li>https://x.com</li>
        </ul>
      </div>)
    case 'required':
      return (<span className='text-red-500'>URLが入力されていません</span>)
    default:
      return (<span></span>)
  }
}
ErrorView.propTypes = {
  error: PropTypes.any.isRequired,
}

const Border: React.FC = () => (
  <div className='flex justify-begin my-6'>
    <hr className='w-1/2' />
  </div>
)

type Confirmed = { confirmed: true, archive: ArchiveItemProps }
type NotConfirmed = { confirmed: false, archive: null }
type ConfirmState = Readonly<
  | ({ loading: true, error: null } & NotConfirmed)
  | ({ loading: false, error: Error | null } & NotConfirmed)
  | ({ loading: false, error: null } & Confirmed)
>
type ConfirmStateAction =
  | { type: 'loading' }
  | { type: 'confirmed', archive: ArchiveItemProps }
  | { type: 'error', error: Error }
const reduceConfirmState: Reducer<ConfirmState, ConfirmStateAction> = (_state, action) => {
  switch (action.type) {
    case 'loading':
      return { loading: true, confirmed: false, archive: null, error: null }
    case 'confirmed':
      return { loading: false, confirmed: true, archive: action.archive, error: null }
    default:
      return { loading: false, confirmed: false, archive: null, error: action.error }
  }
}

async function fetchArchive(url: string): Promise<ArchiveItemProps> {
  const isTwitter = /^https:\/\/x.com/.test(url)
  const isYoutube= /^https:\/\/(www.)?youtube.com/.test(url)
  // Twitterはbotに対してのみOGPを返すため、取得方法の切り替えが必要
  // https://qiita.com/JunkiHiroi/items/f03d4297e11ce5db172e
  const extractor: OGPExtractor = (
    isTwitter ? withOGPScanner
      : (isYoutube ? withYoutubeAPI : withDomParser)
  )

  const ogp = await extractor(url).catch((error) => {
    console.error(error)

    throw error
  })

  return { ...ogp, url }
}

export default ArchivesUpload
