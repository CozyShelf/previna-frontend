// Roteiro de ponta a ponta, seção 5 (validação pelo portal) e o painel da empresa da seção 8. A empresa, as
// ofertas e os resgates da gestante são preparados pela API; a validação é feita pela tela
import { expect, test, type Page } from '@playwright/test'

import {
  ativarGestante,
  criarCupom,
  criarEmpresa,
  criarGestante,
  criarMedico,
  criarProduto,
  criarPromocao,
  darPontos,
  novaMarca,
  resgatarCupom,
  resgatarPromocao,
  type Conta,
} from './apoio/api'
import { card, entrarPelaTela, menu } from './apoio/tela'

test.describe.configure({ mode: 'serial' })

const marca = novaMarca()
const produto = `Fralda ${marca}`
const promocao = `Promo ${marca}`
let empresa: Conta
let outraEmpresa: Conta
let gestante: Conta
// Códigos resgatados pela gestante: o primeiro cupom é validado pela tela, o segundo fica sem uso
const codigos = { cupom: '', cupomSemUso: '', promocao: '' }

// Fora do alfabeto do gerador (sem I, O, 0 e 1): não existe em nenhuma empresa
const INVENTADO = 'IO01IO01'

test.beforeAll(async () => {
  test.setTimeout(120_000)
  empresa = await criarEmpresa(marca)
  outraEmpresa = await criarEmpresa(novaMarca())
  const { id: produtoId } = await criarProduto(empresa, produto, 'FRALDAS')
  const cupom = await criarCupom(empresa, produtoId)
  const { id: promocaoId } = await criarPromocao(empresa, promocao)

  const medico = await criarMedico(marca)
  const pre = await criarGestante(medico, `Gestante ${marca}`)
  await darPontos(medico, pre.id, marca)
  gestante = await ativarGestante(pre, marca)

  codigos.cupom = (await resgatarCupom(gestante, cupom.id)).codigo
  codigos.cupomSemUso = (await resgatarCupom(gestante, cupom.id)).codigo
  codigos.promocao = (await resgatarPromocao(gestante, promocaoId)).codigo
})

const resultado = (page: Page) => page.getByRole('main').getByLabel('Resultado da validação')

async function validar(page: Page, codigo: string) {
  const campo = page.getByLabel('Código')
  await campo.fill(codigo)
  // Enter, como o leitor de QR code faz
  await campo.press('Enter')
}

test('abre Validar cupom pelo menu', async ({ page }) => {
  await entrarPelaTela(page, empresa.login, empresa.senha)
  await menu(page).getByRole('link', { name: 'Validar cupom' }).click()

  await expect(page).toHaveURL(/\/validar-cupom$/)
  await expect(page.getByRole('heading', { name: 'Validar cupom' })).toBeVisible()
  await expect(page.getByLabel('Código')).toBeFocused()
})

test('abre Validar cupom pelo link da etapa 4 do tutorial', async ({ page }) => {
  await entrarPelaTela(page, empresa.login, empresa.senha)
  await page.goto('/tutorial')
  for (let etapa = 1; etapa < 4; etapa++) {
    await expect(page.getByText(`Etapa ${etapa} de 4`)).toBeVisible()
    await page.getByRole('button', { name: 'Próximo' }).click()
  }
  await expect(page.getByText('Etapa 4 de 4')).toBeVisible()
  await page.getByRole('link', { name: 'Ir para Validar cupom' }).click()

  await expect(page).toHaveURL(/\/validar-cupom$/)
  await expect(page.getByRole('heading', { name: 'Validar cupom' })).toBeVisible()
})

test.describe('na tela Validar cupom', () => {
  test.beforeEach(async ({ page }) => {
    await entrarPelaTela(page, empresa.login, empresa.senha)
    await page.goto('/validar-cupom')
  })

  test('o código em minúsculas com Enter valida o cupom (cartão verde)', async ({ page }) => {
    await validar(page, codigos.cupom.toLowerCase())

    const cartao = resultado(page)
    // Verde é o role status; o vermelho é alert
    await expect(cartao).toHaveRole('status')
    await expect(cartao).toContainText('Cupom validado')
    await expect(cartao).toContainText(`Código ${codigos.cupom}`)
    await expect(cartao).toContainText(produto)
    await expect(cartao).toContainText(gestante.nome)
    await expect(cartao).toContainText(/Validado em \d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}/)
    // O campo volta vazio e focado para o próximo código
    await expect(page.getByLabel('Código')).toHaveValue('')
    await expect(page.getByLabel('Código')).toBeFocused()
  })

  test('o mesmo código de novo diz quando já foi utilizado', async ({ page }) => {
    await validar(page, codigos.cupom)

    const cartao = resultado(page)
    await expect(cartao).toHaveRole('alert')
    await expect(cartao).toContainText('Código não validado')
    await expect(cartao).toContainText(
      /Este código já foi utilizado em \d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}\./,
    )
  })

  test('o código da promoção valida a promoção', async ({ page }) => {
    await validar(page, codigos.promocao)

    const cartao = resultado(page)
    await expect(cartao).toHaveRole('status')
    await expect(cartao).toContainText('Promoção validada')
    await expect(cartao).toContainText(promocao)
    await expect(cartao).toContainText('Validado em')
  })

  test('um código inventado não é encontrado', async ({ page }) => {
    await validar(page, INVENTADO)

    const cartao = resultado(page)
    await expect(cartao).toHaveRole('alert')
    await expect(cartao).toContainText('Código não encontrado.')
  })
})

test('outra empresa não encontra os códigos da primeira, nem os já utilizados', async ({
  page,
}) => {
  await entrarPelaTela(page, outraEmpresa.login, outraEmpresa.senha)
  await page.goto('/validar-cupom')

  // Sem uso: não pode ser validado por quem não é a dona do cupom
  await validar(page, codigos.cupomSemUso)
  await expect(resultado(page)).toContainText('Código não encontrado.')
  await expect(resultado(page)).toContainText(`Código ${codigos.cupomSemUso}`)

  // Já utilizado na primeira empresa: a outra também só vê "não encontrado", nunca "já utilizado"
  await validar(page, codigos.cupom)
  await expect(resultado(page)).toContainText(`Código ${codigos.cupom}`)
  await expect(resultado(page)).toContainText('Código não encontrado.')
  await expect(resultado(page)).not.toContainText('já foi utilizado')
})

test('o painel da empresa mostra as últimas validações e os números', async ({ page }) => {
  await entrarPelaTela(page, empresa.login, empresa.senha)
  await expect(page).toHaveURL(/\/$/)

  const validacoes = card(page, 'Últimas validações')
  const linhaCupom = validacoes.getByRole('listitem').filter({ hasText: codigos.cupom })
  await expect(linhaCupom).toContainText(produto)
  await expect(linhaCupom).toContainText('Cupom')
  const linhaPromocao = validacoes.getByRole('listitem').filter({ hasText: codigos.promocao })
  await expect(linhaPromocao).toContainText(promocao)
  await expect(linhaPromocao).toContainText('Promoção')
  // O código não validado não aparece
  await expect(validacoes).not.toContainText(codigos.cupomSemUso)

  const main = page.getByRole('main')
  await expect(main.getByRole('link', { name: 'Cupons ativos 1' })).toBeVisible()
  await expect(main.getByRole('link', { name: 'Promoções vigentes 1' })).toBeVisible()
  // Os cards sem link: o número vem logo depois do rótulo
  const numero = (rotulo: string) => main.getByText(rotulo, { exact: true }).locator('..')
  await expect(numero('Resgates aguardando uso')).toHaveText(/^Resgates aguardando uso\s*1\D/)
  await expect(numero('Validações nos últimos 30 dias')).toHaveText(
    /^Validações nos últimos 30 dias\s*2\s*$/,
  )

  // O botão grande do painel (o menu tem um link com o mesmo nome)
  await main.getByRole('link', { name: 'Validar cupom' }).click()
  await expect(page).toHaveURL(/\/validar-cupom$/)
})
