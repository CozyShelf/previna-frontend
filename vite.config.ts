import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // e2e/ é do Playwright (npm run e2e), que precisa da pilha inteira no ar
    exclude: [...configDefaults.exclude, 'e2e/**'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.d.ts', 'src/main.tsx'],
      // Pisos de cobertura: o PR reprova abaixo deles. Subir junto quando a cobertura subir.
      thresholds: {
        statements: 95,
        branches: 92,
        functions: 95,
        lines: 95,
      },
    },
  },
})
