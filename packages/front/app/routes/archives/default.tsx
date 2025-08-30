import { Outlet } from 'react-router';

export default function ArchivesDefault() {
  return (
    <Outlet />
  )
}

export const handle = {
  breadcrumb: 'アーカイブ',
}
