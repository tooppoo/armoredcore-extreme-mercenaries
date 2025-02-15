import { TZDate } from '@date-fns/tz';
import { eq, sql } from 'drizzle-orm';
import type { Database } from '~/db/driver.server';
import { contentsRevisions } from '~/db/schema.server';

export const updateRevision = (key: string) => (
  db: Database,
  getNow = (): Date => new TZDate(),
) => db
  .insert(contentsRevisions)
  .values({
    contentKey: key,
  })
  .onConflictDoUpdate({
    target: contentsRevisions.contentKey,
    set:{
      revision: sql`${contentsRevisions.revision} + 1`,
      updatedAt: getNow(),
    }
  })

export const getRevision = (key: string) => (db: Database): Promise<number> =>
  db
    .select()
    .from(contentsRevisions)
    .where(eq(contentsRevisions.contentKey, key))
    .get()
    .then((row) => row?.revision ?? 0);
