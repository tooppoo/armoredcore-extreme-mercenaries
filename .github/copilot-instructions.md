# GitHub Copilot Instructions

このプロジェクトでコード提案を行う際は、以下の指針に従ってください。

## 核心原則（優先度順）

### MUST（必須要件）
- **日本語使用**: すべてのコメント、ドキュメント、変数名は日本語を使用
- **セキュリティファースト**: 最小権限の原則、機微情報保護を徹底
- **構造化ログ**: JSON形式でinfo/debug/warn/error/fatalレベルを遵守
- **型安全性**: TypeScriptの型システムを最大限活用、Parse don't validate原則
- **例外処理**: ユーザーが解決不可能な問題のみ例外、それ以外はResult型

### SHOULD（強く推奨）
- **開発スタイル**: UDD > DDD > TDD の優先度
- **設計原則**: 可逆性 > 低結合 = 高凝集 = 直交性 > KISS = YAGNI > DRY
- **テスト**: カバレッジ80%以上、実装と同じディレクトリに配置
- **パフォーマンス**: 客観的指標による測定、基準値の継続監視

### NEVER（禁止）
- 本番環境操作、Secrets出力、無断依存追加、mainブランチ直接push

## コード提案ガイドライン

### 命名規則
- 変数名、関数名、クラス名は日本語を使用
- ファイル名は英語でケバブケース
- 用語は`docs/terms.md`を参照し、専門用語は***太字斜体***で表記

### 構造化ログの実装
```typescript
// ✅ 推奨される構造化ログ
const logger = {
  info: (message: string, context: Record<string, unknown> = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...context
    }));
  }
};

// 使用例
logger.info('ユーザー操作完了', {
  userId: user.id,
  operation: 'profile_update',
  duration_ms: 150
  // password: user.password // ❌ 機微情報は含めない
});
```

### 例外処理パターン
```typescript
// ✅ Result型を使用した失敗表現
type Result<T, E> = { success: true; data: T } | { success: false; error: E };

// ユーザーが解決可能な問題 → Result型
function validateInput(input: string): Result<ValidInput, ValidationError> {
  if (input.length === 0) {
    return { success: false, error: new ValidationError('入力値が空です') };
  }
  return { success: true, data: new ValidInput(input) };
}

// ユーザーが解決不可能な問題 → 例外
function connectToDatabase(): Database {
  try {
    return new Database(config);
  } catch (error) {
    throw new DatabaseConnectionError('データベース接続に失敗しました', error);
  }
}
```

### テスト配置
```
src/
  components/
    UserProfile.tsx
    UserProfile.test.tsx  // ✅ 実装と同じディレクトリ
  services/
    UserService.ts
    UserService.test.ts
```

### アーキテクチャパターン
- レイヤー分離: entrypoint / adapters / application / domain / infrastructure
- 依存の方向: 高次→低次の一方向
- ポリシーと実装の分離
- 生成と実行の分離

## セキュリティ要件

### 依存関係
- 新しい依存を追加する際は特定のバージョンを明示
- キャレット（^）やチルダ（~）などの範囲指定は禁止
```json
// ✅ 推奨
"react": "18.2.0"

// ❌ 禁止
"react": "^18.0.0"
```

### 機微情報保護
- ログに認証情報、個人情報、金融データを含めない
- 環境変数から機微情報を取得する際は起動時に検証

## パフォーマンス基準
- **WebアプリUI**: 初回表示3秒以内、ページ遷移1秒以内
- **API応答**: 平均500ms以内、95%ile 1秒以内
- **開発環境**: ビルド時間初回5分以内、増分30秒以内

## 参考資料
- 詳細な指針: `/AGENTS.md`
- 用語定義: `docs/terms.md`
- 命名規則: `docs/naming.md`
- ADRテンプレート: `docs/adr/template.md`

---

**重要**: 曖昧または矛盾する要求に対しては、推測で対応せず確認を求めること。