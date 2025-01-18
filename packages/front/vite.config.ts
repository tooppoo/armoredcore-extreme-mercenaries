import { reactRouter } from "@react-router/dev/vite";
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare"
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { getLoadContext } from './load-context';
import { envOnlyMacros } from 'vite-env-only';

export default defineConfig({
  build: {
    target: 'es2023',
  },
  plugins: [
    cloudflareDevProxy({
      getLoadContext,
    }),
    reactRouter(),
    tsconfigPaths(),
    envOnlyMacros(),
  ],
});
