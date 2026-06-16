import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['tests/frontend/**'],
    coverage: {
      provider: 'v8',
      include: ['src/backend/domain/**', 'src/backend/application/**'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    conditions: ['import', 'node'],
    alias: [
      {
        find: '@trackforge/shared',
        replacement: path.resolve(__dirname, 'src/shared/index.ts'),
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src/frontend'),
      },
    ],
  },
});
