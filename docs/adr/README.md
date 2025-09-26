# ADR ガイドライン

- ADR の目的は意思決定の経緯と影響を追跡可能にすること。新規・更新時は必ず決定理由と影響評価を明記する。
- 既存 ADR の一覧やタグ検索は `docs/adr/index.md` を参照。必要に応じてリンクを最新状態に更新する。
- ローカルでプレビューする場合は `pnpm adr preview` を推奨。初回は `pnpm install` を実行して依存を揃える。
- 新規 ADR を作成するときは `pnpm adr new` を使うとテンプレートが自動で差し込まれる。
- ADR の形式は `docs/adr/template.md` に従うこと。
- 変更内容を PR に含める際は、関連する仕様・要件ドキュメントの更新要否も確認し、必要に応じてリンクを追加する。
- 後の決定によって過去の決定が上書き（supersede）された時は、該当のADRのステータスを上書きに更新すること。加えて、上書きされたADR・上書したADRへの参照を、それぞれのADRに記載すること

## 参考資料

- [Log4brains ドキュメント](https://github.com/thomvaill/log4brains/tree/develop#readme)
- [ADR に関する概要](https://adr.github.io/)
