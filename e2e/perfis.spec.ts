// Roteiro de ponta a ponta, seção 8: cada perfil só abre as próprias telas. Quem digita o endereço de outra
// volta para o início
import { expect, test } from '@playwright/test'

import { ADMIN } from './apoio/ambiente'
import { criarEmpresa, novaMarca, type Conta } from './apoio/api'
import { caminho, entrarPelaTela } from './apoio/tela'

let empresa: Conta

test.beforeAll(async () => {
  test.setTimeout(60_000)
  empresa = await criarEmpresa(novaMarca())
})

test('o admin que abre /produtos volta para o início', async ({ page }) => {
  await entrarPelaTela(page, ADMIN.login, ADMIN.senha)
  await page.goto('/produtos')

  await expect.poll(() => caminho(page)).toBe('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^(Bom dia|Boa tarde|Boa noite)/)
  await expect(page.getByRole('heading', { name: 'Produtos' })).toHaveCount(0)
})

test('a empresa que abre /medicos volta para o início', async ({ page }) => {
  await entrarPelaTela(page, empresa.login, empresa.senha)
  await page.goto('/medicos')

  await expect.poll(() => caminho(page)).toBe('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^(Bom dia|Boa tarde|Boa noite)/)
  await expect(page.getByRole('heading', { name: 'Médicos' })).toHaveCount(0)
})
