import { type SitemapFunction } from 'remix-sitemap'

export const sitemap: SitemapFunction = () => ({
  exclude: true
})

const AuthError: React.FC = () => {
  return (
    <div>Auth Error</div>
  )
}

export default AuthError
