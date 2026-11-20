import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PainelEmpresa } from './PainelEmpresa'
import { formatarDataHora } from '@/lib/datas'
import { caminhosChamados, simularApi } from '@/test/api'

// Montado na hora local, para o texto esperado não depender do fuso da máquina
const USADO_EM = new Date(2026, 10, 19, 14, 5).toISOString()

const PAINEL = {
  cuponsAtivos: 4,
  promocoesVigentes: 1,
  resgatesAguardandoUso: 6,
  validacoes30Dias: 10,
  cuponsVencendo7Dias: {
    total: 1,
    itens: [{ cupomId: 3, produtoNome: 'Fralda RN', dataValidade: '2026-11-25' }],
  },
  produtosSemOferta: {
    total: 7,
    itens: [
      { produtoId: 8, nome: 'Body' },
      { produtoId: 11, nome: 'Mamadeira' },
    ],
  },
  ultimasValidacoes: [
    {
      resgateId: 12,
      codigo: 'AB12CD34',
      tipo: 'CUPOM',
      titulo: null,
      produtoNome: 'Fralda RN',
      dataUso: USADO_EM,
    },
    {
      resgateId: 13,
      codigo: 'PRMO7788',
      tipo: 'PROMOCAO',
      titulo: 'Semana do bebê',
      produtoNome: null,
      dataUso: USADO_EM,
    },
  ],
}

const VAZIO = {
  cuponsAtivos: 0,
  promocoesVigentes: 0,
  resgatesAguardandoUso: 0,
  validacoes30Dias: 0,
  cuponsVencendo7Dias: { total: 0, itens: [] },
  produtosSemOferta: { total: 0, itens: [] },
  ultimasValidacoes: [],
}

function renderizar() {
  render(
    <MemoryRouter>
      <PainelEmpresa />
    </MemoryRouter>,
  )
}

const secao = (titulo: string) => screen.getByRole('region', { name: titulo })

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PainelEmpresa', () => {
  it('mostra o botão de validar no topo e os quatro números, com os links', async () => {
    const fetch = simularApi({ '/painel/empresa': [{ corpo: PAINEL }] })
    renderizar()

    const validar = screen.getByRole('link', { name: 'Validar cupom' })
    expect(validar).toHaveAttribute('href', '/validar-cupom')
    expect(validar).toHaveClass('bg-previna-600', 'h-12')

    expect(await screen.findByRole('link', { name: 'Cupons ativos 4' })).toHaveAttribute(
      'href',
      '/cupons',
    )
    expect(screen.getByRole('link', { name: 'Promoções vigentes 1' })).toHaveAttribute(
      'href',
      '/promocoes',
    )
    expect(screen.getByText('Resgates aguardando uso').parentElement).toHaveTextContent('6')
    expect(screen.getByText('Validações nos últimos 30 dias').parentElement).toHaveTextContent('10')
    expect(caminhosChamados(fetch)).toEqual(['/painel/empresa'])
  })

  it('lista os cupons vencendo e os produtos sem oferta, com o link e o "e mais N"', async () => {
    simularApi({ '/painel/empresa': [{ corpo: PAINEL }] })
    renderizar()

    const cupom = await screen.findByRole('link', { name: /Fralda RN/ })
    expect(cupom).toHaveAttribute('href', '/cupons/3')
    expect(cupom).toHaveTextContent('vence em 25/11/2026')
    expect(within(secao('Cupons que vencem em 7 dias')).queryByText(/e mais/)).toBeNull()

    const produtos = secao('Produtos sem oferta')
    expect(within(produtos).getByRole('link', { name: 'Body' })).toHaveAttribute(
      'href',
      '/produtos/8',
    )
    expect(within(produtos).getByRole('link', { name: 'Mamadeira' })).toHaveAttribute(
      'href',
      '/produtos/11',
    )
    expect(within(produtos).getByRole('link', { name: 'e mais 5' })).toHaveAttribute(
      'href',
      '/produtos',
    )
    // A dica leva a criar um cupom
    expect(within(produtos).getByText(/não aparece para as gestantes/)).toBeInTheDocument()
    expect(within(produtos).getByRole('link', { name: 'Criar cupom' })).toHaveAttribute(
      'href',
      '/cupons/novo',
    )
  })

  it('mostra as últimas validações com código, produto ou título, tipo e data e hora', async () => {
    simularApi({ '/painel/empresa': [{ corpo: PAINEL }] })
    renderizar()

    const lista = await screen.findByRole('region', { name: 'Últimas validações' })
    const [cupom, promocao] = within(lista).getAllByRole('listitem')
    expect(cupom).toHaveTextContent('AB12CD34')
    expect(cupom).toHaveTextContent('Fralda RN')
    expect(cupom).toHaveTextContent('Cupom')
    expect(cupom).toHaveTextContent(formatarDataHora(USADO_EM))
    expect(promocao).toHaveTextContent('PRMO7788')
    expect(promocao).toHaveTextContent('Semana do bebê')
    expect(promocao).toHaveTextContent('Promoção')
  })

  it('mostra frases positivas nas listas vazias e esconde a dica', async () => {
    simularApi({ '/painel/empresa': [{ corpo: VAZIO }] })
    renderizar()

    expect(await screen.findByText('Nenhum cupom vence nos próximos 7 dias.')).toBeInTheDocument()
    expect(
      screen.getByText('Todos os produtos têm um cupom ou uma promoção valendo.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/Nenhum código validado ainda/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Criar cupom' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cupons ativos 0' })).toBeInTheDocument()
  })

  it('aguenta campos ausentes: número vira traço e lista vira vazia', async () => {
    simularApi({
      '/painel/empresa': [
        { corpo: { cuponsAtivos: 2, ultimasValidacoes: [{ codigo: 'XY', dataUso: 'lixo' }] } },
      ],
    })
    renderizar()

    expect(await screen.findByRole('link', { name: 'Cupons ativos 2' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Promoções vigentes —' })).toBeInTheDocument()
    expect(screen.getByText('Nenhum cupom vence nos próximos 7 dias.')).toBeInTheDocument()
    // Data inválida não derruba a tela: só não aparece
    expect(screen.getByText('XY')).toBeInTheDocument()
  })

  it('no erro mostra "Tentar de novo", que refaz a chamada', async () => {
    const fetch = simularApi({
      '/painel/empresa': [{ status: 500, corpo: {} }, { corpo: PAINEL }],
    })
    renderizar()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o painel.',
    )
    expect(screen.getByRole('link', { name: 'Validar cupom' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByRole('link', { name: 'Cupons ativos 4' })).toBeInTheDocument()
    expect(caminhosChamados(fetch)).toEqual(['/painel/empresa', '/painel/empresa'])
  })

  it('trata um corpo que não é objeto como erro', async () => {
    simularApi({ '/painel/empresa': [{ corpo: null }] })
    renderizar()

    expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })
})
