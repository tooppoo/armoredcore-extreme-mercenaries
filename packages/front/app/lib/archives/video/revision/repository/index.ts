import { getRevision, updateRevision } from '~/lib/utils/revisions'

const revisionKey = 'archive.video.list' as const

export const updateVideoArchiveListRevision = updateRevision(revisionKey)
export const getVideoArchiveListRevision = getRevision(revisionKey)
