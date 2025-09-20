# Front App

## 開発

ローカル起動

```sh
pnpm --filter @ac-extreme-mercenaries/front run dev
```

Wrangler起動

```sh
pnpm --filter @ac-extreme-mercenaries/front run build
pnpm --filter @ac-extreme-mercenaries/front run start
```

## 型定義生成 (Typegen)

`wrangler.toml` に記述されている Cloudflare バインディングの型を生成

```sh
pnpm --filter @ac-extreme-mercenaries/front run typegen
```

`wrangler.toml` を変更するたびに、型定義生成 (typegen) を再実行する必要があります。

## Migration

### Migration追加

`app/db/schema.server.ts` を変更したら実行

```sh
pnpm --filter @ac-extreme-mercenaries/front run migration:gen
```

### ローカル

```sh
pnpm --filter @ac-extreme-mercenaries/front run migration
```

### 本番

```sh
pnpm --filter @ac-extreme-mercenaries/front run migration:prod
```

## Seed

```sh
pnpm --filter @ac-extreme-mercenaries/front run seed
```

## スタイリング

- [Tailwind CSS](https://tailwindcss.com/)
- [Vite の CSS に関するドキュメント](https://vitejs.dev/guide/features.html#css)
