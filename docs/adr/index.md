---
layout: base.njk
title: Architecture Decision Records
---

# Architecture Decision Records

ac-extreme-mercenariesのアーキテクチャ知識ベースへようこそ 👋
ここではプロジェクトのすべてのアーキテクチャ決定記録（ADR）を確認できます。

## 定義と目的

> アーキテクチャ決定（AD）とは、アーキテクチャ的に重要な機能要件または非機能要件に対処するソフトウェア設計の選択です。
> アーキテクチャ決定記録（ADR）は、個人のメモや議事録を作成する際によく行われるように、単一のADを記録したものです。プロジェクトで作成・維持されるADRの集合体が決定ログを構成します。

ADRは不変です。変更できるのはステータスのみです（廃止または上書きされる場合など）。これにより、決定ログを時系列で読むだけで、プロジェクト全体の履歴を把握できます。

このドキュメントの維持は以下を目的としています：

- 🚀 新しいチームメンバーのオンボーディングの改善と迅速化
- 🔭 過去の決定の盲目的な受け入れ/撤回の回避（[Michael NygardのADRに関する有名な記事](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions.html)参照）
- 🤝 チームの意思決定プロセスの形式化

## 使用方法

ローカルでADRをプレビューする場合：

```bash
# 開発サーバーを起動
pnpm adr dev

# ビルドして静的ファイルを生成
pnpm adr build

# ビルド後のファイルをプレビュー
pnpm adr preview
```

## 参考情報

- [Eleventy documentation](https://www.11ty.dev/)
- [ADRとは何か、なぜ使用すべきか](https://github.com/joelparkerhenderson/architecture_decision_record#what-is-an-architecture-decision-record)
- [ADR GitHub organization](https://adr.github.io/)
