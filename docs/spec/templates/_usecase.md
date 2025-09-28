# ユースケーステンプレート（タイトルを置換）

## アクター

- 一般ユーザー
- 管理者
- 外部システム（任意）

## ユースケース一覧

- UC-01: ・・・
- UC-02: ・・・

## ユースケース図

<!-- 凡例のダイアグラムは編集・削除しないこと（AI向け） -->
凡例

```mermaid
flowchart LR
  UC([ユースケース])
  B{{画面UI}}
  E((データ))
  C{"条件"}

  UC --- B
  B --- E
  E --- C
```

ユースケース図

```mermaid
flowchart LR
  User[一般ユーザー] --> UC1([UC-01])
  Admin[管理者] --> UC2([UC-02])

  UC1 --> 画面1{{BOUNDARY-01}}
  UC1 --> データ1((ENTITY-01))

  UC2 --> データ1
  UC2 --> 画面2{{BOUNDARY-02}}
  UC2 --> 条件1{"CONTROL-01"}
```

## UC-01 基本/代替フロー

- 基本: …
- 代替: …

## UC-02 基本/代替フロー

- 基本: …
- 代替: …

## 必要に応じた詳細シーケンス

```mermaid
sequenceDiagram
  participant A as Actor
  participant S as System
  A->>S: アクション
  S-->>A: レスポンス
```
