// Roteiro de ponta a ponta, seção 8: lista de gestantes com linha clicável, agendamento pela tela (com o aviso
// de repetido) e o painel do médico. O médico e as gestantes são criados pela API: um médico novo, sem
// permissão de ver todas as gestantes, só tem no painel e na lista o que este teste criou
import { expect, test } from '@playwright/test'

import {
  agendar,
  criarGestante,
  criarMedico,
  exameAgendavel,
  formatarData,
  hoje,
  novaMarca,
  type Conta,
  type Gestante,
  type TipoAtendimento,
} from './apoio/api'
import { caminho, card, entrarPelaTela, escolherOpcao, menu } from './apoio/tela'

test.describe.configure({ mode: 'serial' })

const marca = novaMarca()
let medico: Conta
let exame: TipoAtendimento
// Agendada pela tela para amanhã: entra nos próximos 7 dias
let agendada: Gestante
// Sem nada agendado
let semAgendamento: Gestante
// Com exame para hoje, agendado pela API: entra na agenda do dia
let deHoje: Gestante
const amanha = hoje(1)

test.beforeAll(async () => {
  test.setTimeout(60_000)
  medico = await criarMedico(marca)
  exame = await exameAgendavel(medico)
  agendada = await criarGestante(medico, `Ana ${marca}`)
  semAgendamento = await criarGestante(medico, `Bia ${marca}`)
  deHoje = await criarGestante(medico, `Carla ${marca}`)
  await agendar(medico, deHoje.id, hoje(), marca)
})

test.beforeEach(async ({ page }) => {
  await entrarPelaTela(page, medico.login, medico.senha)
})

test('na lista de gestantes, clicar numa célula que não é o nome abre a gestante', async ({
  page,
}) => {
  await menu(page).getByRole('link', { name: 'Gestantes' }).click()
  const linha = page.getByRole('row', { name: new RegExp(agendada.nome) })
  // A coluna "Idade gestacional" é texto puro, sem link
  const celula = linha.getByRole('cell', { name: '12 semanas' })
  await expect(celula).toBeVisible()
  await celula.click()

  await expect.poll(() => caminho(page)).toBe(`/gestantes/${agendada.id}`)
  await expect(page.getByRole('heading', { name: agendada.nome })).toBeVisible()
})

test('agenda um exame para a gestante pela tela', async ({ page }) => {
  await page.goto(`/gestantes/${agendada.id}`)
  // O do cabeçalho; sem nada cadastrado, a lista vazia repete o link
  await page.getByRole('link', { name: 'Cadastrar exame ou consulta' }).first().click()
  await escolherOpcao(page.getByLabel('Exame ou consulta'), exame.nome)
  await page.getByLabel('Data prevista').fill(amanha)
  await page.getByLabel('Observação').fill(marca)
  await page.getByRole('button', { name: 'Cadastrar', exact: true }).click()

  await expect.poll(() => caminho(page)).toBe(`/gestantes/${agendada.id}`)
  await expect(page.getByRole('status')).toHaveText(
    `Cadastro de ${exame.nome} realizado com sucesso.`,
  )
})

test('o mesmo exame na mesma data mostra o aviso de agendamento repetido', async ({ page }) => {
  await page.goto(`/gestantes/${agendada.id}/agendamentos/novo`)

  await test.step('repetido dentro do mesmo cadastro', async () => {
    await page.getByRole('button', { name: 'Adicionar exame ou consulta' }).click()
    for (const indice of [0, 1]) {
      await escolherOpcao(page.getByLabel('Exame ou consulta').nth(indice), exame.nome)
      await page.getByLabel('Data prevista').nth(indice).fill(amanha)
    }
    await page.getByRole('button', { name: 'Cadastrar', exact: true }).click()
    await expect(
      page.getByText('Esse exame ou consulta já está na lista nessa data.'),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Remover' }).nth(1).click()
  })

  await test.step('repetido com o que já foi agendado', async () => {
    await expect(page.getByLabel('Exame ou consulta')).toHaveCount(1)
    await page.getByRole('button', { name: 'Cadastrar', exact: true }).click()
    await expect(page.getByRole('alert')).toHaveText(
      'Essa gestante já tem esse exame ou consulta pendente nessa data. Mude a data ou o exame.',
    )
    await expect.poll(() => caminho(page)).toBe(`/gestantes/${agendada.id}/agendamentos/novo`)
  })
})

test('o painel do médico mostra a agenda do dia, os próximos 7 dias e quem está sem agendamento', async ({
  page,
}) => {
  await expect.poll(() => caminho(page)).toBe('/')
  const main = page.getByRole('main')

  await expect(main.getByRole('link', { name: '3 gestantes acompanhadas' })).toBeVisible()

  const agendaDoDia = card(page, 'Exames e consultas de hoje')
  await expect(agendaDoDia.getByRole('link')).toHaveCount(1)
  await expect(agendaDoDia.getByRole('link')).toContainText(deHoje.nome)
  await expect(agendaDoDia.getByRole('link')).toContainText(exame.nome)

  await expect(card(page, 'Atrasados')).toContainText('Nenhum exame ou consulta atrasado.')

  const proximos = card(page, 'Próximos 7 dias')
  await expect(proximos.getByRole('link')).toHaveCount(1)
  const linha = proximos.getByRole('link')
  await expect(linha).toContainText(agendada.nome)
  await expect(linha).toContainText(exame.nome)
  await expect(linha).toContainText('Exame')
  await expect(linha).toContainText(formatarData(amanha))

  const semNada = card(page, 'Gestantes sem nada agendado')
  await expect(semNada.getByRole('link')).toHaveCount(1)
  await expect(semNada.getByRole('link')).toContainText(semAgendamento.nome)

  // Cada item leva à gestante
  await linha.click()
  await expect.poll(() => caminho(page)).toBe(`/gestantes/${agendada.id}`)
})
