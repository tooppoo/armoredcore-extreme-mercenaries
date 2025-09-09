# CI lint ワークフローでgit-auto-commit-actionを手動Git操作に置き換え

- ステータス: 承認済み
- 日付: 2025-09-09
- タグ: CI/CD, GitHub Actions, Git, lint

技術ストーリー: Pull Request #698 でのCI auto-commit失敗を解決する

## 背景 / 文脈

CI環境のlint-fixジョブで `stefanzweifel/git-auto-commit-action` を使用していたが、Pull Request環境において以下の問題が発生していた：

```bash
error: atomic push failed for ref refs/heads/vk/c75e-corepages. status: 5
! [rejected] HEAD -> vk/c75e-corepages (fetch first)
hint: Updates were rejected because the remote contains work that you do not have locally.
```

この問題により、lintで自動修正された変更をコミットできず、CIが失敗していた。

## 決定ドライバ

- **CI安定性**: Pull Requestでのlint処理が確実に動作する必要がある
- **競合解決**: 複数のCIジョブが並行実行される環境での競合状態への対応
- **デバッグ性**: 問題発生時の調査・解決が容易であること
- **保守性**: 将来の類似問題を予防できる仕組みであること

## 検討した選択肢

1. **git-auto-commit-actionの設定調整** - 既存アクションのオプション変更で解決を試行
2. **手動Git操作への置き換え** - bash scriptによる明示的なGit操作
3. **別のGitHub Action使用** - 他のauto-commit系アクションへの移行

## 決定（採択）

選択したオプション: "手動Git操作への置き換え"。理由: git-auto-commit-actionの設定調整では根本的な競合問題を解決できず、Pull Request環境特有のdetached HEAD状態や並行CI実行による競合を確実に回避するため。

## 影響評価

- **セキュリティ**: 影響なし。同等のGitHub token権限を使用
- **パフォーマンス**: 軽微な改善。不要なコミット作成を回避
- **ユーザー体験**: 大幅改善。CI失敗が解消されPRマージが可能に
- **アクセシビリティ**: 影響なし
- **トレーサビリティ**: 改善。各Git操作が明示的でログ解析が容易

### ポジティブな影響

- CI安定性の向上：競合状態での確実な動作
- デバッグ容易性：各ステップが明示的で問題箇所の特定が容易
- 無駄なコミット削減：変更がない場合の自動スキップ
- 将来の拡張性：必要に応じてより複雑なGit操作を追加可能

### ネガティブな影響 / トレードオフ

- 保守コスト：bashスクリプトの維持が必要
- 実装の複雑さ：単一アクション利用よりもコード量が増加
- エラーハンドリング：各Git操作での個別対応が必要

## 各選択肢の利点と欠点

### git-auto-commit-actionの設定調整

設定オプション（`push_options: '--force-with-lease'`、`fetch-depth: 0`等）による改善を試行

- 良い点: 既存の仕組みを活用、実装変更が最小限
- 良い点: コミュニティでテスト済みのソリューション
- 悪い点: Pull Request環境のdetached HEAD状態を根本解決できない
- 悪い点: 並行CI実行による競合状態への対応が不十分

### 手動Git操作への置き換え

bashスクリプトによる明示的なGit操作の実装

- 良い点: 競合状態の確実な解決（git pull + git push）
- 良い点: 条件分岐による無駄なコミット防止
- 良い点: デバッグとトラブルシューティングが容易
- 良い点: 将来の要件変更に対する柔軟性
- 悪い点: 保守すべきコードの増加
- 悪い点: Git操作の詳細知識が必要

### 別のGitHub Action使用

他のauto-commit系アクションへの移行

- 良い点: コミュニティ実績のある別解決策
- 良い点: 専用アクションによる機能の充実
- 悪い点: 根本的な競合問題は環境に依存するため解決保証なし
- 悪い点: 新しいアクションの学習・検証コスト

## フォローアップ / 移行計画

実装内容：

```yaml
- name: auto commit
  run: |
    git config --local user.email "41898282+github-actions[bot]@users.noreply.github.com"
    git config --local user.name "github-actions[bot]"
    git add -A
    if git diff --cached --quiet; then
      echo "No changes to commit"
    else
      git checkout ${{ github.head_ref }}
      git pull origin ${{ github.head_ref }}
      git add -A
      git commit -m "Auto commit with fmt" --author="tooppoo <10760022+tooppoo@users.noreply.github.com>"
      git push origin ${{ github.head_ref }}
    fi
```

- Checkout設定にて `fetch-depth: 0` を追加し完全なGit履歴を取得
- 変更検出による条件分岐でパフォーマンス向上
- エラー時の詳細ログによるトラブルシューティング支援

## 参考リンク

- [Pull Request #698](https://github.com/tooppoo/armoredcore-extreme-mercenaries/pull/698) - 問題が発生したPR
- [GitHub Actions CI failure logs](https://github.com/tooppoo/armoredcore-extreme-mercenaries/actions/runs/17544399037) - 失敗時のログ
- [stefanzweifel/git-auto-commit-action](https://github.com/stefanzweifel/git-auto-commit-action) - 元々使用していたアクション