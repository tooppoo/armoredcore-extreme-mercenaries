# ADRビューアをLog4brainsからEleventyに移行する

- ステータス: 承認済み
- 日付: 2025-09-26
- タグ: ツール選定, セキュリティ, 依存関係管理

技術ストーリー: Log4brainsのセキュリティ脆弱性問題により、ADRビューアツールの移行を実施する。

## 背景 / 文脈

Dependabotセキュリティアラートにより、criticalとhighレベルの脆弱性が32件検出された。主要な原因はlog4brainsパッケージの依存関係にある以下のパッケージ：

**Critical レベル:**

- shell-quote (1.7.2以下)
- simple-git (3.16.0未満)
- loader-utils (1.4.1未満)
- parse-url (8.1.0未満)

**High レベル:**

- parse-git-config (修正版なし)
- next (14.2.15未満)
- node-fetch (3.0.0未満)
- nth-check (2.0.1未満)

pnpm overridesによる脆弱性パッケージのバージョン強制更新を試みたが、log4brains自体が動作不能になった。

## 決定ドライバ

- セキュリティ脆弱性の根本的解決が必要
- log4brainsの保守性とセキュリティ懸念の増大
- ADRビューアの機能は維持しつつ、依存関係を最小化したい
- パッケージの隔離により本体への影響を回避したい

## 検討した選択肢

### 1. VitePress（初回検討）

- **Pros**: Vue/Viteベース、高速、豊富な機能
- **Cons**: 入力ファイルを外部ディレクトリから読み込む制限あり
- **結果**: 柔軟性不足により不採用

### 2. Eleventy（最終採用）

- **Pros**: 任意ディレクトリ（`../../docs/adr`）からの入力対応、軽量、柔軟な設定
- **Cons**: VitePressに比べて設定が必要
- **結果**: 採用

### 3. Log4brains継続（不採用）

- セキュリティ脆弱性が解決不可能

## 決定（採択）

**Eleventyベースの隔離ADRビューア**を採用する。

### 実装概要

1. **パッケージ構成**

   ```text
   packages/adr/
   ├── package.json           # Eleventy + プラグイン
   ├── eleventy.config.mjs    # Eleventy設定
   └── .gitignore            # _site/ 等を除外

   docs/adr/                  # ADRソースファイル
   ├── _includes/base.njk     # テンプレート
   ├── _data/layout.cjs       # デフォルトレイアウト
   └── *.md                   # ADRファイル群
   ```

2. **主要機能**
   - 自動サイドバー生成（日付順ソート）
   - ファイル名からタイトル自動抽出
   - GitHub風レスポンシブデザイン
   - シンタックスハイライト対応

3. **運用方法**

   ```bash
   # 開発サーバー
   pnpm adr dev

   # 静的サイト生成
   pnpm adr build

   # プレビュー
   pnpm adr preview
   ```

## 影響評価

### ポジティブな影響

- **セキュリティ大幅改善**: Critical 4件 → 0件、High 12件 → 1件
- **依存関係隔離**: 本体プロジェクトへの脆弱性影響を遮断
- **保守性向上**: 軽量で理解しやすい構成
- **柔軟性確保**: 外部ディレクトリからの入力対応

### ネガティブな影響

- **学習コスト**: Eleventyの設定とテンプレート作成
- **機能差**: Log4brainsの一部高度機能は失われる
- **初期設定**: テンプレートとスタイリングの手動実装

### セキュリティ改善結果

```txt
更新前: 4 critical, 12 high, 11 moderate, 5 low
更新後: 0 critical, 0 high, 1 moderate, 0 low
```

Critical脆弱性が全て解消され、High脆弱性も全て解決。依存関係の大幅な簡素化により、セキュリティリスクが劇的に改善。

## 実装詳細

### 1. 依存関係管理

- `@11ty/eleventy`: 静的サイトジェネレーター本体
- `@11ty/eleventy-plugin-syntaxhighlight`: シンタックスハイライト

### 2. Dependabot設定更新

```yaml
- package-ecosystem: "npm"
  directory: "/packages/adr"
  schedule:
    interval: "weekly"
    day: "monday"
    time: "02:00"
    timezone: "Asia/Tokyo"
```

週次監視により隔離パッケージの依存関係を管理。

## その他検討事項

- **将来的な拡張**: 必要に応じてサーチ機能やタグ分類を追加可能
- **CI連携**: PR時の静的サイト生成とアーティファクト保存を検討
- **パフォーマンス**: 現在のADR件数（18件）では問題なし

## ロールバック計画

問題発生時は以下の順序で対応：

1. **Eleventy設定問題**: 設定ファイルの修正
2. **機能不足**: 必要機能の追加実装
3. **根本的問題**: 一時的にDocsify（CDN版）での代替運用

## 承認と実装状況

- **実装完了日**: 2025-09-26
- **テスト状況**: ローカル環境で動作確認済み
- **セキュリティ監査**: 脆弱性大幅改善を確認

## 参考リンク

- [ADR管理ツールとしてLog4brainsを採用する](20250124-use-log4brains-to-manage-the-adrs.md) - この決定により上書きされた過去のADR
