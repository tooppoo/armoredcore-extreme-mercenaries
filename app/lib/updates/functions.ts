import { format } from 'date-fns';
import { Update } from '~/lib/updates/record.server';

export function toTitle(r: Update): string {
  return `${r.title} - ${format(r.published_at, 'yyyy/MM/dd')}`
}
