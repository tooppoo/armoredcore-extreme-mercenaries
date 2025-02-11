import { reactRouter } from "@react-router/dev/vite";
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare"
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { getLoadContext } from './load-context';

export default defineConfig(({ mode }) => ({
  build: {
    target: 'es2023',
    minify: true,
    cssMinify: true,
  },
  plugins: [
    // dev専用プラグインなら、production では除外する
    ...(mode !== 'production'
      ? [
          cloudflareDevProxy({
            getLoadContext,
            configPath: mode === 'test' ? 'wrangler.test.toml' : undefined,
            environment: mode === 'test' ? 'test' : undefined,
          }),
          reactRouter(),
        ]
      : [reactRouter()]),
    tsconfigPaths(),
  ],
}));
