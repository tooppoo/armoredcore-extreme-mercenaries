import type { Database } from '~/db/driver.server';

// https://react-router-docs-ja.techtalk.jp/upgrading/remix
declare module "react-router" {
  interface AppLoadContext {
    whatever: string;
    db: Database;
  }
}

export {}; // これをモジュールとして扱うために TS に必要