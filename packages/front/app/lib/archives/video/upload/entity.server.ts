
export type Uploader = Readonly<{
  id: string
  name: string
}>

export type Archive = Readonly<{
  contents: ArchiveContents
  uploader: Uploader
}>

export type ArchiveContents = Readonly<{
  externalId: string
  title: string
  description: string
  imageUrl: URL
  url: URL
}>
