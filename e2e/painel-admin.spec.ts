// Roteiro de ponta a ponta, seções 8 e 9: a atividade recente do painel do admin mostra as ações do log de
// auditoria. As ações são feitas pela API logo antes (agendado, confirmado, cupom e promoção resgatados, código
// validado); a gestante aparece só como "Gestante", sem o nome (LGPD)
import { expect, test } from '@playwright/test'

import { ADMIN } from './apoio/ambiente'
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
  validarCodigo,
  type Conta,
} from './apoio/api'
import { card, entrarPelaTela } from './apoio/tela'

const marca = novaMarca()
let medico: Conta
let empresa: Conta
let gestante: Conta
let pontos: number

test.beforeAll(async () => {
  test.setTimeout(120_000)
  medico = await criarMedico(marca)
  empresa = await criarEmpresa(marca)
  const { id: produtoId } = await criarProduto(empresa, `Fralda ${marca}`, 'FRALDAS')
  const cupom = await criarCupom(empresa, produtoId)
  const promocao = await criarPromocao(empresa, `Promo ${marca}`)

  const pre = await criarGestante(medico, `Gestante ${marca}`)
  // Agendado e confirmado: duas ações do médico
  pontos = await darPontos(medico, pre.id, marca)
  gestante = await ativarGestante(pre, marca)
  // Resgates: ações da gestante
  const { codigo } = await resgatarCupom(gestante, cupom.id)
  await resgatarPromocao(gestante, promocao.id)
  // Validação: ação da empresa
  await validarCodigo(empresa, codigo)
})

test('a atividade recente mostra as ações, e a gestante só como "Gestante"', async ({ page }) => {
  const respostaDoPainel = page.waitForResponse((r) => r.url().endsWith('/painel/admin'))
  await entrarPelaTela(page, ADMIN.login, ADMIN.senha)
  const atividade = card(page, 'Atividade recente')
  const item = (acao: string, autor: string) =>
    atividade.getByRole('listitem').filter({ hasText: acao }).filter({ hasText: autor }).first()

  // Médico e empresa aparecem pelo nome, com o perfil
  await expect(item('Exame ou consulta agendado', `${medico.nome} (Médico)`)).toBeVisible()
  await expect(item('Exame ou consulta confirmado', `${medico.nome} (Médico)`)).toContainText(
    `+${pontos} pontos`,
  )
  await expect(item('Código validado', `${empresa.nome} (Empresa parceira)`)).toBeVisible()

  // As ações da gestante, as mais recentes de cada tipo: autor "Gestante", sem nome
  const cupom = item('Cupom resgatado', 'Gestante')
  await expect(cupom).toContainText('−1 ponto')
  await expect(cupom.locator('span').last()).toHaveText(/^Gestante · \d{2}\/\d{2}\/\d{4} às /)
  const promocao = item('Promoção resgatada', 'Gestante')
  await expect(promocao.locator('span').last()).toHaveText(/^Gestante · \d{2}\/\d{2}\/\d{4} às /)

  // O nome da gestante não aparece em lugar nenhum do painel, nem na resposta da API
  await expect(page.locator('body')).not.toContainText(gestante.nome)
  expect(await (await respostaDoPainel).text()).not.toContain(gestante.nome)
})
