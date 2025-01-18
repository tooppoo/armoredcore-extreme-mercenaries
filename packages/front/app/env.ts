import type { Database } from '~/db/driver.server';

// https://react-router-docs-ja.techtalk.jp/upgrading/remix
declare module "react-router" {
  interface AppLoadContext {
    whatever: string;
    db: Database;
  }

  // TODO: ローダーの `Route.LoaderArgs` への移行が完了したら、これを削除する
  interface LoaderFunctionArgs {
    context: AppLoadContext;
  }

  // TODO: アクションの `Route.ActionArgs` への移行が完了したら、これを削除する
  interface ActionFunctionArgs {
    context: AppLoadContext;
  }
}

export {}; // これをモジュールとして扱うために TS に必要