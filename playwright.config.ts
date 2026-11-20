import { defineConfig, devices } from '@playwright/test'

import { URL_PORTAL } from './e2e/apoio/ambiente'

// Testes de ponta a ponta do portal (pasta e2e/). Precisam da pilha inteira no ar (ambiente de dev do
// previna-development): portal, API, banco e MailHog. Não rodam na CI do portal. Veja o README.
export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  // Um teste por vez: a atividade recente do admin mostra as últimas ações do sistema inteiro, e testes em
  // paralelo misturariam as ações uns dos outros
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: URL_PORTAL,
    locale: 'pt-BR',
    // O mesmo fuso do backend (LocalDate.now() da JVM em America/Sao_Paulo): "hoje" é o mesmo dia nos dois
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
