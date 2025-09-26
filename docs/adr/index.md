---
layout: base.njk
title: Architecture Decision Records
---

# Architecture Decision Records

Welcome 👋 to the architecture knowledge base of ac-extreme-mercenaries.
You will find here all the Architecture Decision Records (ADR) of the project.

## Definition and purpose

> An Architectural Decision (AD) is a software design choice that addresses a functional or non-functional requirement that is architecturally significant.
> An Architectural Decision Record (ADR) captures a single AD, such as often done when writing personal notes or meeting minutes; the collection of ADRs created and maintained in a project constitutes its decision log.

An ADR is immutable: only its status can change (i.e., become deprecated or superseded). That way, you can become familiar with the whole project history just by reading its decision log in chronological order.
Moreover, maintaining this documentation aims at:

- 🚀 Improving and speeding up the onboarding of a new team member
- 🔭 Avoiding blind acceptance/reversal of a past decision (cf [Michael Nygard's famous article on ADRs](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions.html))
- 🤝 Formalizing the decision process of the team

## Usage

ローカルでADRをプレビューする場合：

```bash
# 開発サーバーを起動
pnpm adr dev

# ビルドして静的ファイルを生成
pnpm adr build

# ビルド後のファイルをプレビュー
pnpm adr preview
```

## More information

- [VitePress documentation](https://vitepress.dev/)
- [What is an ADR and why should you use them](https://github.com/joelparkerhenderson/architecture_decision_record#what-is-an-architecture-decision-record)
- [ADR GitHub organization](https://adr.github.io/)
