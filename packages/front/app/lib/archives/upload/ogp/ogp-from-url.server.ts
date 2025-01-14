import { failedGetOGP, FailedGetOGPError, unsupportedUrl, UnsupportedUrlError } from '~/lib/archives/upload/errors.server';
import { defaultSelectOgpStrategy, type OGP, type SelectOgpStrategy } from '~/lib/archives/upload/ogp/ogp-strategy.server';
import { makeCatchesSerializable } from '~/lib/error';

export type GetOGPFromURL = (url: URL) => Promise<OGP>
export const getOGPFromURL = (
  select: SelectOgpStrategy = defaultSelectOgpStrategy
): GetOGPFromURL => async (url) => {
  const strategy = select(url)
  if (strategy === null) {
    return Promise.reject(
      {
        code: unsupportedUrl,
        message: `${url.toString()} is not supported`,
        url: url.toString(),
      } satisfies UnsupportedUrlError
    )
  }

  return strategy(url).catch((error) => Promise.reject(
    {
      code: failedGetOGP,
      message: error instanceof Error
        ? error.message
        : JSON.stringify(error),
      detail: makeCatchesSerializable(error),
    } satisfies FailedGetOGPError
  ))
}
