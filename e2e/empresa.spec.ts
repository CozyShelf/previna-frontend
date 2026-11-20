// Roteiro de ponta a ponta, seção 1: empresa, produto, cupom e promoção, tudo pela tela do portal
import { expect, test } from '@playwright/test'

import { ADMIN, SENHA } from './apoio/ambiente'
import { gerarCnpj, hoje, novaMarca, senhaTemporariaPorEmail, sufixo } from './apoio/api'
import { entrarPelaTela, escolherOpcao, menu } from './apoio/tela'

// Cada teste continua de onde o anterior parou
test.describe.configure({ mode: 'serial' })

const marca = novaMarca()
const empresa = {
  nome: `Empresa ${marca}`,
  cnpj: gerarCnpj(),
  email: `e2e.e.${sufixo(marca)}@previna.test`,
  login: `e2e.e.${sufixo(marca)}`,
}
const fralda = `Fralda ${marca}`
const semCategoria = `Mamadeira ${marca}`
const promocao = `Promo ${marca}`
let senhaTemporaria: string

test('o admin pré-cadastra a empresa e a senha temporária chega por e-mail', async ({ page }) => {
  await entrarPelaTela(page, ADMIN.login, ADMIN.senha)
  await menu(page).getByRole('link', { name: 'Empresas parceiras' }).click()
  await page.getByRole('link', { name: 'Pré-cadastrar empresa' }).click()

  await page.getByLabel('Razão social').fill(empresa.nome)
  await page.getByLabel('CNPJ').fill(empresa.cnpj)
  await page.getByLabel('Responsável').fill(`Responsável ${marca}`)
  await page.getByLabel('E-mail').fill(empresa.email)
  await page.getByLabel('Telefone').fill('1133334444')
  await page.getByRole('button', { name: 'Cadastrar empresa' }).click()

  await expect(
    page.getByRole('heading', { name: 'Empresa pré-cadastrada e pré-login enviado' }),
  ).toBeVisible()
  await expect(page.getByText(empresa.email)).toBeVisible()

  senhaTemporaria = await senhaTemporariaPorEmail(empresa.email)
  expect(senhaTemporaria).toBeTruthy()
})

test('a empresa faz o primeiro acesso com a senha do e-mail', async ({ page }) => {
  // O login temporário é o CNPJ; com a senha temporária, o portal leva direto ao primeiro acesso
  await entrarPelaTela(page, empresa.cnpj, senhaTemporaria)
  await expect(page).toHaveURL(/\/primeiro-acesso$/)
  await expect(
    page.getByRole('heading', { name: 'Finalize o cadastro da sua empresa' }),
  ).toBeVisible()

  await page.getByLabel('Novo login').fill(empresa.login)
  await page.getByLabel('Nova senha', { exact: true }).fill(SENHA)
  await page.getByLabel('Confirme a nova senha').fill(SENHA)
  await page.getByLabel('Segmento').fill('Farmácia')
  await page.getByLabel('Endereço').fill('Rua dos Testes, 100')
  await page.getByRole('button', { name: 'Salvar e continuar' }).click()

  await expect(page).toHaveURL(/\/tutorial$/)
  await expect(page.getByRole('heading', { name: 'Boas-vindas ao Previna' })).toBeVisible()
})

test('a empresa cadastra produtos, cupom e promoção', async ({ page }) => {
  await entrarPelaTela(page, empresa.login, SENHA)

  await test.step('produto FRALDAS', async () => {
    await menu(page).getByRole('link', { name: 'Produtos' }).click()
    await page.getByRole('link', { name: 'Cadastrar produto' }).click()
    await page.getByLabel('Nome').fill(fralda)
    await page.getByLabel('Categoria').selectOption({ label: 'Fraldas' })
    await page.getByLabel('Preço sem desconto (R$)').fill('59,90')
    await page.getByRole('button', { name: 'Cadastrar produto' }).click()

    await expect(page.getByRole('status')).toHaveText(`Produto ${fralda} cadastrado com sucesso.`)
    await expect(page.getByRole('row', { name: new RegExp(fralda) })).toBeVisible()
  })

  await test.step('produto sem categoria', async () => {
    await page.getByRole('link', { name: 'Cadastrar produto' }).click()
    await page.getByLabel('Nome').fill(semCategoria)
    await expect(page.getByLabel('Categoria')).toHaveValue('')
    await page.getByRole('button', { name: 'Cadastrar produto' }).click()

    await expect(page.getByRole('status')).toHaveText(
      `Produto ${semCategoria} cadastrado com sucesso.`,
    )
  })

  await test.step('cupom do produto FRALDAS', async () => {
    await menu(page).getByRole('link', { name: 'Cupons' }).click()
    await page.getByRole('link', { name: 'Cadastrar cupom' }).click()
    await escolherOpcao(page.getByLabel('Produto'), fralda)
    await page.getByLabel('Desconto (%)').fill('10')
    await page.getByLabel('Validade').fill(hoje(30))
    await page.getByLabel('Pontos para resgatar').fill('5')
    await page.getByRole('button', { name: 'Cadastrar cupom' }).click()

    await expect(page).toHaveURL(/\/cupons$/)
    await expect(page.getByRole('status')).toHaveText(
      `Cupom “10% de desconto em ${fralda}” cadastrado com sucesso.`,
    )
  })

  await test.step('promoção FRALDAS vigente hoje', async () => {
    await menu(page).getByRole('link', { name: 'Promoções' }).click()
    await page.getByRole('link', { name: 'Cadastrar promoção' }).click()
    await page.getByLabel('Título').fill(promocao)
    await page.getByLabel('Desconto (%)').fill('15')
    await page.getByLabel('Categoria').selectOption({ label: 'Fraldas' })
    await page.getByLabel('Início').fill(hoje())
    await page.getByLabel('Fim').fill(hoje(30))
    await page.getByRole('button', { name: 'Cadastrar promoção' }).click()

    await expect(page).toHaveURL(/\/promocoes$/)
    await expect(page.getByRole('status')).toHaveText(
      `Promoção ${promocao} cadastrada com sucesso.`,
    )
  })
})

test('D12: outra promoção FRALDAS no mesmo período avisa da sobreposição', async ({ page }) => {
  await entrarPelaTela(page, empresa.login, SENHA)
  await page.goto('/promocoes/novo')
  await page.getByLabel('Título').fill(`Promo sobreposta ${marca}`)
  await page.getByLabel('Desconto (%)').fill('20')
  await page.getByLabel('Categoria').selectOption({ label: 'Fraldas' })
  // Começa depois e termina antes da primeira: inteira dentro do período dela
  await page.getByLabel('Início').fill(hoje(5))
  await page.getByLabel('Fim').fill(hoje(10))
  await page.getByRole('button', { name: 'Cadastrar promoção' }).click()

  await expect(page.getByRole('alert')).toHaveText(
    'Já existe uma promoção ativa dessa categoria nesse período. Mude o período, a categoria ou desative a outra promoção.',
  )
  await expect(page).toHaveURL(/\/promocoes\/novo$/)
})

test('D10: o produto sem categoria aceita cupom, e promoção sempre pede categoria', async ({
  page,
}) => {
  await entrarPelaTela(page, empresa.login, SENHA)

  await page.goto('/cupons/novo')
  await escolherOpcao(page.getByLabel('Produto'), semCategoria)
  await page.getByLabel('Desconto (%)').fill('5')
  await page.getByLabel('Validade').fill(hoje(15))
  await page.getByLabel('Pontos para resgatar').fill('3')
  await page.getByRole('button', { name: 'Cadastrar cupom' }).click()

  await expect(page).toHaveURL(/\/cupons$/)
  await expect(page.getByRole('status')).toHaveText(
    `Cupom “5% de desconto em ${semCategoria}” cadastrado com sucesso.`,
  )

  // A promoção vale para uma categoria inteira: não há como criar uma para o produto sem categoria
  await page.goto('/promocoes/novo')
  const categorias = await page.getByLabel('Categoria').locator('option').allTextContents()
  expect(categorias).toEqual(['Escolha…', 'Fraldas', 'Roupas', 'Remédios'])
  await page.getByLabel('Título').fill(`Promo sem categoria ${marca}`)
  await page.getByLabel('Desconto (%)').fill('10')
  await page.getByLabel('Início').fill(hoje())
  await page.getByLabel('Fim').fill(hoje(5))
  await page.getByRole('button', { name: 'Cadastrar promoção' }).click()
  await expect(page.getByText('Escolha a categoria.')).toBeVisible()
  await expect(page).toHaveURL(/\/promocoes\/novo$/)
})
