import { LoaderFunction } from '@remix-run/cloudflare';
import { type SitemapFunction } from 'remix-sitemap';
import { getAuthentication } from '~/lib/auth/authentication.server';
// import { action } from './auth.discord'
import { Form } from '@remix-run/react';

export const sitemap: SitemapFunction = () => ({
  exclude: true
})

export const loader: LoaderFunction = async ({ request, context }) => {
  return await getAuthentication({ context }).isAuthenticated(request, {
    failureRedirect: "/",
  });
};

const ArchivesUpload: React.FC = () => {
  return (
    <>
      <h2>Archives Upload</h2>
      <section>
        <Form action='/archives/upload' method='post'>
          <div>
            <input

              type="text"
            />
          </div>
        </Form>
      </section>
    </>
  )
}

export default ArchivesUpload
