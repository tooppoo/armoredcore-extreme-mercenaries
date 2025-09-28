import { type ArchiveContents } from '~/lib/archives/video/upload/entity.server'
import { type PostArchiveBody } from '~/lib/archives/video/upload/params.server'

export const overrideArchiveContents = (
  archive: ArchiveContents,
  data: Pick<PostArchiveBody, 'title' | 'description'>,
): ArchiveContents => {
  if (data.title === undefined && data.description === undefined) {
    return archive
  }

  return {
    ...archive,
    title: data.title ?? archive.title,
    description: data.description ?? archive.description,
  }
}
