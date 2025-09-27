
# Instructions

- Use Japanese
- Follow the instructions in {repository root}/AGENTS.md
- セッション開始時は最初のアクションとして `read_file path="AGENTS.md"` を実行し、内容を読み込んでから作業を進めること
- 依存を追加・更新する検討に入る前に `read_file path="docs/checklist/add-dependency.md"` でチェックリストを読み、承認手順に従うこと
- プロンプト生成時は AGENTS.md の優先度（MUST > SHOULD > MAY > NEVER）を考慮すること
- 曖昧または矛盾する要求に対しては AGENTS.md の「確認を求める」原則に従うこと
- セキュリティ関連の判断は AGENTS.md のセキュリティセクションを優先すること
- 実装時は AGENTS.md の構造化ログ、例外処理、型レベルプログラミングの指針に従うこと
- テストカバレッジは80%以上を維持し、AGENTS.md のテスト方針に従うこと
- パフォーマンス要件は AGENTS.md のパフォーマンス方針（基準値監視、測定主義）に従うこと
- 本番運用では AGENTS.md の監視・メトリクス方針（観測可能性、軽量監視）を適用すること
