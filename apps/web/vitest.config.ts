import { createRequire } from 'module';
import { defineConfig } from 'vitest/config';
import path from 'path';
import type { Plugin } from 'vite';

const require = createRequire(import.meta.url);

/**
 * Pre-plugin: transforms .tsx/.jsx with esbuild's React automatic runtime
 * BEFORE vite's import-analysis runs. Required because the Next.js tsconfig
 * sets jsx:"preserve", which would otherwise leave raw JSX for Vite's parser
 * (oxc in Vite 8) to choke on. This file is excluded from the app typecheck
 * (see tsconfig "exclude"); vitest validates it at runtime.
 */
function reactJsxPlugin(): Plugin {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const esbuild = require('esbuild') as typeof import('esbuild');
  return {
    name: 'vitest-react-jsx',
    enforce: 'pre',
    async transform(code, id) {
      if (!/\.[jt]sx$/.test(id)) return;
      const result = await esbuild.transform(code, {
        loader: id.endsWith('.tsx') ? 'tsx' : 'jsx',
        jsx: 'automatic',
        jsxImportSource: 'react',
        target: 'es2022',
        format: 'esm',
      });
      return { code: result.code, map: result.map };
    },
  };
}

export default defineConfig({
  plugins: [reactJsxPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
