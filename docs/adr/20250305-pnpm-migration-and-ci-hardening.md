# pnpm 10.17.0 への移行と CI サプライチェーン対策

- ステータス: 下書き
- 日付: 2025-09-11
- タグ: CI/CD セキュリティ 依存管理

技術ストーリー: [Issue #730](https://github.com/tooppoo/armoredcore-extreme-mercenaries/issues/730)

## 背景 / 文脈

npm のライフサイクルスクリプト悪用事例が報じられ、既定で postinstall 等が実行される状態ではサプライチェーン攻撃リスクが高い。加えて、Corepack が Node.js 本体から分離する予定があり、pnpm を明示的に導入しなければ既存の npm ワークフローが破綻する懸念がある。CI における依存の即時スキャンとロックファイルの整合性検証を仕組み化し、安全性と再現性を担保する必要がある。

## 決定ドライバ

- npm postinstall 等の自動実行を抑止したいというセキュリティニーズ
- Corepack 分離に備え、pnpm バージョンを明示して開発環境を統一する必要
- CI で依存の脆弱性およびロックファイル改ざんを即検知したい

## 検討した選択肢

1. npm を継続利用しつつ `npm install --ignore-scripts` と audit を都度実行する
1. pnpm へ移行し `.npmrc` でスクリプト実行を抑止、CI で `pnpm audit` と `lockfile-lint` を導入する
1. yarn Berry へ移行し PnP + Zero-install を前提にする

## 決定（採択）

選択したオプション: "pnpm へ移行し `.npmrc` でスクリプト実行を抑止、CI で `pnpm audit` と `lockfile-lint` を導入する"。理由: npm 継続案は `package-lock.json` による整合性担保が弱く、Corepack 分離後に再度移行コストが発生する。yarn Berry は既存ワークフローと互換性が低く、CI 設定変更が大規模になる。pnpm への移行は最小限の変更でセキュリティ要件を満たし、`.npmrc` と新規 CI ワークフローでスクリプト抑止とロックファイル検証を実現できる。

## 影響評価

- セキュリティ: ライフサイクルスクリプトを既定無効化、`pnpm audit` と `lockfile-lint` による依存改ざん検知でリスクを低減。
- パフォーマンス: pnpm のハードリンクキャッシュによりローカル・CI とも依存解決が高速化する見込み。audit の追加に伴い CI 時間が +数十秒程度増加する。
- ユーザー体験: 開発者は `pnpm` CLI を使用する必要があるが、`pnpm install --ignore-scripts` で再現性が高まり、`pnpm rebuild <pkg>` で必要パッケージのみスクリプトを実行できる。
- アクセシビリティ: 直接的な影響なし。
- トレーサビリティ: 監査結果をアーティファクト (`reports/pnpm-audit.json`) として保存し、依存更新の証跡を強化。

### ポジティブな影響

- 依存導入時のサプライチェーンリスクを早期に検知可能。
- pnpm バージョン固定によりローカルと CI の環境差異を縮小。
- ロックファイル改ざん検出でレビュー漏れを防止。

### ネガティブな影響 / トレードオフ

- `pnpm install` 実行時にスクリプトが動作しないため、ネイティブバイナリが必要な場合は `pnpm rebuild` を手動実行する運用が必要。
- 既存 npm コマンドを使用するドキュメント・スクリプトは更新が必要。

## 各選択肢の利点と欠点

### npm を継続利用

- 良い点: 既存ワークフローを維持できる。
- 悪い点: `package-lock.json` の衝突が多くメンテナンスコストが高い。
- 悪い点: Corepack 分離後に再移行が必要。
- 悪い点: スクリプト抑止を徹底する設定が乏しい。

### pnpm へ移行

- 良い点: `.npmrc` で `ignore-scripts` を既定化できる。
- 良い点: `pnpm` 固有のストア共有でインストールが高速。
- 良い点: `pnpm audit` や `lockfile-lint` を統一ワークフローに組み込みやすい。
- 悪い点: `pnpm` CLI 学習コスト。
- 悪い点: パイプライン全体のコマンド置換が必要。

### yarn Berry

- 良い点: PnP による依存解決を厳格化できる。
- 良い点: Zero-install 対応でリポジトリ配布が容易。
- 悪い点: 既存ツールチェーンとの互換性が低く設定変更が大規模。
- 悪い点: PnP 非対応のツールに追加設定が必要。

## フォローアップ / 移行計画

- `pnpm install --ignore-scripts` を標準手順とし、ネイティブ依存が必要な場合は `pnpm rebuild --filter <pkg>` をドキュメント化する。
- 既存 GitHub Actions を順次 `pnpm` ベースに置換し、`pnpm install --frozen-lockfile --ignore-scripts` のみ許可する。
- 監査レポートを `reports/pnpm-audit.json` としてアーティファクト化し、重大脆弱性検出時はジョブを失敗させる運用を検討。

## 参考リンク

- [npm ライフサイクルスクリプト悪用事例 (gihyo.jp)](https://gihyo.jp)
- [pnpm audit ドキュメント](https://pnpm.io/cli/audit)
- [lockfile-lint](https://github.com/lirantal/lockfile-lint)
