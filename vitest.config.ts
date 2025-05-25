import path from 'path'
import { defineConfig } from 'vitest/config'
import wasm from 'vite-plugin-wasm'

export default defineConfig({
  plugins: [wasm()],
  test: {
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    deps: {
      // Handle external dependencies better
      external: ['@shuding/opentype.js'],
    },
  },
  resolve: {
    alias: [
      {
        find: '@yoga',
        replacement: path.resolve(__dirname, 'src', 'yoga', 'yoga-prebuilt.ts'),
      },
    ],
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['@jsr/loading__taffy', '@shuding/opentype.js'],
  },
  esbuild: {
    // Let esbuild handle CommonJS modules
    format: 'esm',
    target: 'node16',
  },
})
