
# Discord Bot パッケージ

このパッケージは、ARMORED CORE EXTREME MERCENARIES プロジェクトの Discord Bot 機能を提供します。

## 概要

***Discord Bot*** は、ゲームコミュニティとの連携を担当するエージェントです。

## 主な機能

- コミュニティ用のSlash Command登録

## 技術スタック

- **言語**: TypeScript
- **ランタイム**: Node.js
- **主要ライブラリ**: discord.js

## セットアップ

### 前提条件

- Node.js 20.x 以上
- Discord Bot トークン（環境変数 `DISCORD_BOT_TOKEN` で設定）

### インストール

```bash
# ルートディレクトリから
pnpm install
```

### 環境変数

```bash
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_guild_id_here
DISCORD_CLIENT_ID=your_client_id_here
```

## 開発

### 起動

```bash
pnpm run dev
```

### テスト

```bash
pnpm test
```

### 型チェック

```bash
pnpm typecheck
```

## ***セキュリティ***

- Bot トークンは環境変数で管理し、ログに出力しない
- 最小権限の原則に従い、必要な権限のみを付与
- ***構造化ログ*** から機微情報を除外

## 関連ドキュメント

- [用語集](../../docs/terms.md)
- [ADR](../../docs/adr/)
- [命名規則](../../docs/naming.md)
