import { generateRobotsTxt } from '@nasa-gcn/remix-seo'
import { origin } from '~/lib/constants';

export function loader() {
  return generateRobotsTxt([
    { type: "sitemap", value: origin + "/sitemap.xml" },
  ]);
}
