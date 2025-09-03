import globals from 'globals'
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import _import from 'eslint-plugin-import'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

// globalsのキーの空白を除去するユーティリティ
const fixedGlobals = Object.fromEntries(
  Object.entries({
    ...globals.browser,
    ...globals.commonjs,
    ...globals.node,
  }).map(([key, value]) => [key.trim(), value]),
)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  {
    ignores: ['test-results', 'node_modules'],
  },
  ...compat.extends('eslint:recommended'),
  {
    languageOptions: {
      globals: fixedGlobals,

      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  ...fixupConfigRules(compat.extends('plugin:react/recommended')).map(
    (config) => ({
      ...config,
      files: ['**/*.{js,jsx,ts,tsx}'],
    }),
  ),
  ...fixupConfigRules(
    compat.extends(
      'plugin:@typescript-eslint/recommended',
      'plugin:import/recommended',
      'plugin:import/typescript',
    ),
  ).map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  {
    files: ['**/*.{ts,tsx}'],

    plugins: {
      '@typescript-eslint': fixupPluginRules(typescriptEslint),
      import: fixupPluginRules(_import),
    },

    languageOptions: {
      parser: tsParser,
    },

    settings: {
      'import/resolver': {
        node: {
          extensions: ['.ts', '.tsx'],
        },

        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
  },
]
