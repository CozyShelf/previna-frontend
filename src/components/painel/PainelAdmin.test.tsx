import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PainelAdmin } from './PainelAdmin'
import { formatarDataHora } from '@/lib/datas'
import { caminhosChamados, simularApi } from '@/test/api'

const DIA = 86_400_000
const QUANDO = new Date(2026, 10, 20, 1, 0).toISOString()

function painel() {
  return {
    medicos: 5,
    empresas: { total: 9, primeiroAcessoPendente: 2 },
    gestantes: { total: 30, primeiroAcessoPendente: 4 },
    conteudos: { publicados: 8, rascunhos: 1 },
    empresasPendentes: {
      total: 4,
      itens: [
        {
          empresaId: 3,
          razaoSocial: 'Loja X',
          preCadastradaEm: new Date(Date.now() - 3 * DIA).toISOString(),
        },
        { empresaId: 6, razaoSocial: 'Loja Y', preCadastradaEm: new Date().toISOString() },
      ],
    },
    atividadeRecente: [
      {
        dataHora: QUANDO,
        acao: 'AGENDAMENTO_REALIZADO',
        usuarioNome: 'Médico Teste',
        perfil: 'MEDICO',
        pontos: 50,
        // Campos a mais que o contrato não prevê: a tela não pode mostrar
        gestanteNome: 'Maria Sigilosa',
        gestanteId: 77,
        gestanteCpf: '12345678900',
      },
      {
        dataHora: QUANDO,
        acao: 'CUPOM_RESGATADO',
        // A gestante foi quem fez: aparece só o perfil, nunca o nome
        usuarioNome: 'Joana Sigilosa',
        perfil: 'GESTANTE',
        pontos: -100,
      },
      {
        dataHora: QUANDO,
        acao: 'RESGATE_VALIDADO',
        usuarioNome: 'Loja X',
        perfil: 'EMPRESA_PARCEIRA',
        pontos: null,
      },
      { dataHora: QUANDO, acao: 'ACAO_NOVA', usuarioNome: 'Admin', perfil: 'ADMIN' },
    ],
  }
}

function renderizar() {
  render(
    <MemoryRouter>
      <PainelAdmin />
    </MemoryRouter>,
  )
}

const secao = (titulo: string) => screen.getByRole('region', { name: titulo })

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PainelAdmin', () => {
  it('mostra os quatro números com o primeiro acesso, os rascunhos e os links', async () => {
    const fetch = simularApi({ '/painel/admin': [{ corpo: painel() }] })
    renderizar()

    expect(await screen.findByRole('link', { name: 'Médicos 5' })).toHaveAttribute(
      'href',
      '/medicos',
    )
    expect(
      screen.getByRole('link', { name: 'Empresas parceiras 9 2 no primeiro acesso' }),
    ).toHaveAttribute('href', '/empresas')
    expect(screen.getByRole('link', { name: 'Conteúdos publicados 8 1 rascunho' })).toHaveAttribute(
      'href',
      '/conteudos',
    )
    // Gestantes só como contagem, sem link: o administrador não abre a lista delas
    const gestantes = screen.getByText('Gestantes').parentElement!
    expect(gestantes).toHaveTextContent('30')
    expect(gestantes).toHaveTextContent('4 no primeiro acesso')
    expect(gestantes.tagName).not.toBe('A')
    expect(caminhosChamados(fetch)).toEqual(['/painel/admin'])
  })

  it('lista as empresas pendentes com há quantos dias e o "e mais N"', async () => {
    simularApi({ '/painel/admin': [{ corpo: painel() }] })
    renderizar()

    await screen.findByText('Loja Y')
    const lista = secao('Empresas aguardando o primeiro acesso')
    const [x, y] = within(lista).getAllByRole('listitem')
    expect(x).toHaveTextContent('Loja X')
    expect(x).toHaveTextContent('pré-cadastrada há 3 dias')
    expect(y).toHaveTextContent('pré-cadastrada hoje')
    expect(within(lista).getByRole('link', { name: 'e mais 2' })).toHaveAttribute(
      'href',
      '/empresas',
    )
  })

  it('mostra a atividade recente em texto amigável, com quem fez, quando e os pontos', async () => {
    simularApi({ '/painel/admin': [{ corpo: painel() }] })
    renderizar()

    await screen.findByText('Exame ou consulta confirmado')
    const [realizado, resgate, validado, desconhecida] = within(
      secao('Atividade recente'),
    ).getAllByRole('listitem')
    expect(realizado).toHaveTextContent('Médico Teste (Médico)')
    expect(realizado).toHaveTextContent(formatarDataHora(QUANDO))
    expect(realizado).toHaveTextContent('+50 pontos')
    expect(resgate).toHaveTextContent('Cupom resgatado')
    expect(resgate).toHaveTextContent('−100 pontos')
    expect(validado).toHaveTextContent('Código validado')
    expect(validado).toHaveTextContent('Loja X (Empresa parceira)')
    expect(validado).not.toHaveTextContent('pontos')
    expect(desconhecida).toHaveTextContent('Atividade registrada')
  })

  it('não mostra nenhum dado de gestante, mesmo que venha na resposta', async () => {
    simularApi({ '/painel/admin': [{ corpo: painel() }] })
    renderizar()

    await screen.findByText('Cupom resgatado')
    expect(screen.queryByText(/Sigilosa/)).not.toBeInTheDocument()
    expect(screen.queryByText(/12345678900/)).not.toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('77')
    expect(screen.queryByRole('link', { name: /gestante/i })).not.toBeInTheDocument()
  })

  it('mostra frases positivas nas listas vazias', async () => {
    simularApi({
      '/painel/admin': [
        {
          corpo: {
            ...painel(),
            empresasPendentes: { total: 0, itens: [] },
            atividadeRecente: [],
          },
        },
      ],
    })
    renderizar()

    expect(
      await screen.findByText('Todas as empresas já fizeram o primeiro acesso.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Nenhuma atividade registrada ainda.')).toBeInTheDocument()
  })

  it('aguenta campos ausentes sem quebrar a tela', async () => {
    simularApi({
      '/painel/admin': [
        {
          corpo: {
            medicos: 1,
            empresasPendentes: { itens: [{ razaoSocial: 'Loja Z' }] },
            atividadeRecente: [{}],
          },
        },
      ],
    })
    renderizar()

    expect(await screen.findByRole('link', { name: 'Médicos 1' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Empresas parceiras —' })).toBeInTheDocument()
    expect(screen.getByText('Loja Z')).toBeInTheDocument()
    expect(screen.getByText('Atividade registrada')).toBeInTheDocument()
  })

  it('no erro mostra "Tentar de novo", que refaz a chamada', async () => {
    const fetch = simularApi({ '/painel/admin': [{ status: 500, corpo: {} }, { corpo: painel() }] })
    renderizar()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o painel.',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByRole('link', { name: 'Médicos 5' })).toBeInTheDocument()
    expect(caminhosChamados(fetch)).toEqual(['/painel/admin', '/painel/admin'])
  })

  it('tem os atalhos de cadastro', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))
    renderizar()

    const atalhos = screen.getByRole('navigation', { name: 'Atalhos' })
    expect(within(atalhos).getByRole('link', { name: 'Cadastrar médico' })).toHaveAttribute(
      'href',
      '/medicos/novo',
    )
    expect(within(atalhos).getByRole('link', { name: 'Pré-cadastrar empresa' })).toHaveAttribute(
      'href',
      '/empresas/pre-cadastro',
    )
    expect(within(atalhos).getByRole('link', { name: 'Novo conteúdo' })).toHaveAttribute(
      'href',
      '/conteudos/novo',
    )
  })
})
