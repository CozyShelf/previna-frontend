// Ações de tela usadas por vários testes
import { expect, type Locator, type Page } from '@playwright/test'

export async function entrarPelaTela(page: Page, login: string, senha: string) {
  await page.goto('/login')
  await page.getByLabel('Login', { exact: true }).fill(login)
  await page.getByLabel('Senha', { exact: true }).fill(senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).not.toHaveURL(/\/login$/)
}

export const menu = (page: Page) => page.getByRole('navigation', { name: 'Menu principal' })

// Caminho da URL atual, sem o endereço do portal
export const caminho = (page: Page) => new URL(page.url()).pathname

// Escolhe a opção da lista suspensa pelo texto que ela contém (o rótulo pode trazer preço, pontos etc.)
export async function escolherOpcao(select: Locator, texto: string) {
  const opcao = select.locator('option', { hasText: texto }).first()
  const valor = await opcao.getAttribute('value')
  if (!valor) throw new Error(`Opção "${texto}" não encontrada.`)
  await select.selectOption(valor)
}

// Card do painel (seção com título), pelo título exato
export const card = (page: Page, titulo: string) =>
  page.getByRole('main').getByRole('region', { name: titulo, exact: true })
