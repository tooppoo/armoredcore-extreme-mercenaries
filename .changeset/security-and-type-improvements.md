---
"@ac-extreme-mercenaries/front": patch
---

Cloudflare Pages向けDiscordインタラクションのセキュリティ強化と型安全性向上

- 公開鍵未設定時の署名検証ロジックを厳格化（セキュリティリスク修正）
- getAllowedChannels関数のフォールバック条件を厳格化（設定ミス検出）
- エラーハンドリングロジックの重複を解消（コード品質向上）
- command-validatorの冗長な型キャストを削除（型安全性活用）