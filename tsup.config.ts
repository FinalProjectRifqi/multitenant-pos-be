import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['cjs'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // Exclude test files (mirrors tsconfig.build.json)
  ignoreWatch: ['**/__tests__/**', '**/*.spec.ts'],
  // Bundle ESM-only packages directly into the CJS output so that
  // Node.js never tries to require() them at runtime.
  noExternal: ['jose'],
});
