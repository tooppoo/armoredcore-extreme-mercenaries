# Discord Bot パッケージ

このパッケージは、ARMORED CORE EXTREME MERCENARIES プロジェクトの Discord Bot 機能を提供します。

## 概要

**_Discord Bot_** は、ゲームコミュニティとの連携を担当するエージェントです。

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

### コマンド登録

Discord にコマンドを登録する場合は、以下のスクリプトを実行します。

```bash
pnpm run deploy:commands
```

### 型チェック

```bash
pnpm typecheck
```

## **_セキュリティ_**

- Bot トークンは環境変数で管理し、ログに出力しない
- 最小権限の原則に従い、必要な権限のみを付与
- **_構造化ログ_** から機微情報を除外

## 関連ドキュメント

- [用語集](../../docs/terms.md)
- [ADR](../../docs/adr/)
- [命名規則](../../docs/naming.md)
