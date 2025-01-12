import { type SitemapFunction } from 'remix-sitemap';
import { redirect, type ActionFunction, type LoaderFunction } from "@remix-run/node";
import { getAuthentication } from "~/lib/auth/authentication.server";
import { Form } from '@remix-run/react';

export const sitemap: SitemapFunction = () => ({
  exclude: true
})

export const loader: LoaderFunction = async ({ request, context }) => {
  await getAuthentication({ context }).isAuthenticated(request, {
    successRedirect: "/archives/upload",
  });

  const url = new URL(request.url)
  const [k1, k2] = [url.searchParams.get('k1'), url.searchParams.get('k2')]
  if (
    k1 !== context.cloudflare.env.AUTH_ACCESS_KEY1
    || k2 !== context.cloudflare.env.AUTH_ACCESS_KEY2
  ) {
    return redirect('/')
  }

  return {}
}

export const action: ActionFunction = ({ request, context }) => {
  return getAuthentication({ context }).authenticate("discord", request);
};

const AuthDiscord: React.FC = () => {
  return (
    <section className='flex flex-col items-center'>
      <h2>メンバー用認証</h2>
      <Form action='/auth/discord' method='post'>
        <button
          type="submit"
          className='border rounded-md p-4 m-4'
        >
          Discord認証
        </button>
      </Form>
    </section>
  )
}

export default AuthDiscord
