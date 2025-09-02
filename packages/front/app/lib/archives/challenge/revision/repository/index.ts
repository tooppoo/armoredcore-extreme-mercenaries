import {
  getRevision,
  getRevisionUpdatedAt,
  updateRevision,
} from '~/lib/utils/revisions'

const revisionKey = 'archive.challenge.list' as const

export const updateChallengeArchiveListRevision = updateRevision(revisionKey)
export const getChallengeArchiveListRevision = getRevision(revisionKey)
export const getChallengeArchiveListUpdatedAt =
  getRevisionUpdatedAt(revisionKey)
