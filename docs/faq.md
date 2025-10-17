# FAQ / Troubleshooting

## Vite SSR / PostCSS のエラー: Failed to load native binding

- 症状（例）:
  - `Failed to load PostCSS config ... Loading PostCSS Plugin failed: Failed to load native binding`
  - `(@/packages/front/postcss.config.js)` のようなスタックで Vite が落ちる
- 原因: ローカル環境でのネイティブバイナリの不一致や破損（依存の更新後・Node の切替後に発生しやすい）
- 対処（再現性の高い解決策）:
  1. ルートの `node_modules` を削除
  2. クリーンインストール

  ```sh
  rm -rf node_modules
  npm ci
  ```

  併せて、フロントの一時成果物を掃除するのも有効です。

  ```sh
  rm -rf packages/front/build packages/front/node_modules
  npm -w @ac-extreme-mercenaries/front ci
  ```

- 補足:
  - Node のバージョンを `engines`（`>=20`）に合わせると安定します。
  - それでも解決しない場合は `npm rebuild` の実行、Vite/Tailwind のキャッシュ削除（`packages/front/build`, `packages/front/.vite`）も試してください。
