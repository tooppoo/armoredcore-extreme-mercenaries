import { Outlet } from 'react-router'

export default function UpdatesDefault() {
  return <Outlet />
}

export const handle = {
  breadcrumb: '更新履歴',
}
