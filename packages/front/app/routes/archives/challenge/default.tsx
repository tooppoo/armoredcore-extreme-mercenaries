import { Outlet } from 'react-router'

export default function ChallengeArchivesDefault() {
  return <Outlet />
}

export const handle = {
  breadcrumb: 'チャレンジアーカイブ',
}
