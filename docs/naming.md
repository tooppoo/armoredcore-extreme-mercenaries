# 命名規則（Naming Conventions）

本ドキュメントはリポジトリ横断の命名規則を定義します。サブディレクトリ固有の上書き規則がある場合は、各ディレクトリ配下の `AGENTS.md` で補足してください（ルート規約 < サブ規約 < 直近の指示）。

## ファイル

- 一般（関数/モジュール/ユーティリティなど）
  - kebab-case: `archive-repository.ts`, `verify-signature.ts`, `command-validator.ts`
- React コンポーネント
  - PascalCase: `UserCard.tsx`, `ArchiveList.tsx`
- テスト
  - `*.spec.ts` / `*.spec.tsx`
  - 例: `interactions.contract.spec.ts`, `interactions.video.integration.spec.ts`
- 例外
  - 自明な慣例ファイル: `README.md`, `LICENSE`, `CHANGELOG.md`
  - 外部ツールが生成する命名（変更不可のもの）

## ディレクトリ

- kebab-case を基本とする: `api-client/`, `command-validator/`
- テストディレクトリは `__tests__` を推奨

## 追加ルール

- 環境変数は SCREAMING_SNAKE_CASE: `DISCORD_PUBLIC_KEY`, `BASE_LONG_CACHE_TIME`
- エクスポートされる型は PascalCase、値は camelCase を基本とする
- ファイル名と主要エクスポートは意味的に対応させる（例: `archive-repository.ts` は `upsertArchive` 等）

## 自動検出（参考）

- テスト検出: `packages/front/vitest.config.ts` の `include: ['**/*.spec.ts']`
- CI/Lint で命名を検査する場合は、別途 ESLint ルール（例: `filename-case`）を導入可能（依存追加は承認フローに従う）
