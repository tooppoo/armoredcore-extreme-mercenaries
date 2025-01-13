import { format } from 'date-fns';
import { Update } from 'packages/front/app/lib/updates/record';

export function toTitle(r: Update): string {
  return `${r.title} - ${format(r.published_at, 'yyyy/MM/dd')}`
}
