import { render, screen, within } from '@testing-library/react'
import { isValidElement } from 'react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RotaProtegida, type RotaProtegidaProps } from '@/components/RotaProtegida'
import { ITENS_MENU } from '@/components/sistema/menu'
import { rotas } from '@/routes'
import { entrarComo } from '@/test/sessao'

const PERFIS = ['ADMIN', 'MEDICO', 'EMPRESA_PARCEIRA']

// Abertas a qualquer perfil logado; o início muda o conteúdo conforme o perfil
const COMUNS = ['/', '/perfil']

// Quem abre cada rota da área logada. Confere com o menu (Sidebar) e com o @PreAuthorize do backend
const PERFIS_POR_ROTA: Record<string, string[]> = {
  '/gestantes': ['MEDICO'],
  '/gestantes/pre-cadastro': ['MEDICO'],
  '/gestantes/:id': ['MEDICO'],
  '/gestantes/:id/agendamentos/novo': ['MEDICO'],
  '/tipos-atendimento': ['MEDICO'],
  '/tipos-atendimento/novo': ['MEDICO'],
  '/tipos-atendimento/:id': ['MEDICO'],
  '/medicos': ['ADMIN'],
  '/medicos/novo': ['ADMIN'],
  '/medicos/:id': ['ADMIN'],
  '/empresas': ['ADMIN'],
  '/empresas/pre-cadastro': ['ADMIN'],
  '/conteudos': ['ADMIN'],
  '/conteudos/novo': ['ADMIN'],
  '/conteudos/:id': ['ADMIN'],
  '/produtos': ['EMPRESA_PARCEIRA'],
  '/produtos/novo': ['EMPRESA_PARCEIRA'],
  '/produtos/:id': ['EMPRESA_PARCEIRA'],
  '/promocoes': ['EMPRESA_PARCEIRA'],
  '/promocoes/novo': ['EMPRESA_PARCEIRA'],
  '/promocoes/:id': ['EMPRESA_PARCEIRA'],
  '/cupons': ['EMPRESA_PARCEIRA'],
  '/cupons/novo': ['EMPRESA_PARCEIRA'],
  '/cupons/:id': ['EMPRESA_PARCEIRA'],
  '/validar-cupom': ['EMPRESA_PARCEIRA'],
  '/tutorial': ['EMPRESA_PARCEIRA'],
}

interface RotaFolha {
  caminho: string
  // Undefined: basta estar logado
  perfis?: string[]
}

function protecaoDe(rota: RouteObject): RotaProtegidaProps | undefined {
  const elemento = rota.element
  return isValidElement(elemento) && elemento.type === RotaProtegida
    ? (elemento.props as RotaProtegidaProps)
    : undefined
}

function juntar(base: string, trecho?: string) {
  if (!trecho) return base
  if (trecho.startsWith('/')) return trecho
  return `${base.replace(/\/$/, '')}/${trecho}`
}

// Percorre a árvore e devolve as páginas de dentro da RotaProtegida de cima, cada uma com os perfis da
// RotaProtegida mais próxima que os declara
function folhasDaAreaLogada(
  lista: RouteObject[],
  base = '',
  logada = false,
  perfis?: string[],
): RotaFolha[] {
  return lista.flatMap((rota) => {
    const protecao = protecaoDe(rota)
    const caminho = juntar(base, rota.path)
    const dentro = logada || protecao !== undefined
    const perfisAqui = protecao?.perfis ?? perfis
    if (rota.children) return folhasDaAreaLogada(rota.children, caminho, dentro, perfisAqui)
    return dentro ? [{ caminho: caminho || '/', perfis: perfisAqui }] : []
  })
}

const FOLHAS = folhasDaAreaLogada(rotas)

// Pela tabela, e não pela árvore: os testes de abrir cada tela conferem as rotas contra ela
function podeAbrir(caminho: string, perfil: string) {
  return COMUNS.includes(caminho) || (PERFIS_POR_ROTA[caminho]?.includes(perfil) ?? false)
}

function abrir(caminho: string) {
  // O layout busca o perfil de quem está logado; as listagens recebem uma página vazia e a agenda, uma lista vazia
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    if (String(url).endsWith('/agendamentos/hoje')) return new Response('[]')
    return new Response(
      JSON.stringify({
        nome: 'Loja',
        login: 'loja',
        cnpj: '11222333000181',
        email: 'contato@loja.com',
        telefone: '1133334444',
        responsavel: 'Carla',
        endereco: 'Rua A, 1',
        segmento: 'Farmácia',
        itens: [],
        pagina: 0,
        tamanho: 20,
        total: 0,
        totalPaginas: 0,
      }),
    )
  })
  const router = createMemoryRouter(rotas, { initialEntries: [caminho] })
  render(<RouterProvider router={router} />)
  return router
}

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('rotas', () => {
  it('a empresa parceira abre Validar cupom pelo menu, com a trilha', async () => {
    entrarComo('EMPRESA_PARCEIRA')
    abrir('/validar-cupom')

    expect(await screen.findByRole('heading', { name: 'Validar cupom' })).toBeInTheDocument()
    const menu = within(screen.getByRole('navigation', { name: 'Menu principal' }))
    expect(menu.getByRole('link', { name: 'Validar cupom' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    const trilha = within(screen.getByRole('navigation', { name: 'Trilha de navegação' }))
    expect(trilha.getByText('Validar cupom')).toBeInTheDocument()
  })

  it.each(['ADMIN', 'MEDICO'])(
    'o perfil %s não abre Validar cupom e volta ao início',
    async (perfil) => {
      entrarComo(perfil)
      abrir('/validar-cupom')

      expect(await screen.findByRole('heading', { level: 1 })).not.toHaveTextContent(
        'Validar cupom',
      )
      expect(screen.queryByRole('textbox', { name: 'Código' })).not.toBeInTheDocument()
    },
  )
})

describe('rotas por perfil', () => {
  it('toda rota da área logada, fora as comuns, declara os perfis que a abrem', () => {
    const semPerfis = FOLHAS.filter((f) => !COMUNS.includes(f.caminho) && !f.perfis?.length)

    // Rota nova sem perfil cai aqui: coloque-a no bloco RotaProtegida do perfil certo em routes.tsx
    expect(semPerfis.map((f) => f.caminho)).toEqual([])
  })

  it('as rotas comuns continuam abertas a qualquer perfil logado', () => {
    for (const caminho of COMUNS) {
      expect(FOLHAS.find((f) => f.caminho === caminho)).toEqual({ caminho, perfis: undefined })
    }
  })

  it('os perfis de cada rota são os da tabela', () => {
    const declarados = Object.fromEntries(
      FOLHAS.filter((f) => !COMUNS.includes(f.caminho)).map((f) => [f.caminho, f.perfis]),
    )

    expect(declarados).toEqual(PERFIS_POR_ROTA)
  })

  it.each(PERFIS)('o perfil %s abre todos os itens do próprio menu', (perfil) => {
    const itens = ITENS_MENU[perfil] ?? []

    expect(itens.length).toBeGreaterThan(0)
    for (const item of itens) expect(podeAbrir(item.to, perfil), item.to).toBe(true)
  })

  // As de parâmetro (:id) buscam o registro, então ficam de fora; a proteção delas é a do bloco (testes acima)
  const ESTATICAS = FOLHAS.map((f) => f.caminho).filter((c) => !c.includes(':'))
  const CASOS = PERFIS.flatMap((perfil) => ESTATICAS.map((caminho) => ({ perfil, caminho })))

  it.each(CASOS)('$perfil em $caminho', async ({ perfil, caminho }) => {
    entrarComo(perfil)
    const router = abrir(caminho)

    // Página aberta ou início depois do redirecionamento: as duas têm título
    await screen.findByRole('heading', { level: 1 })

    expect(router.state.location.pathname).toBe(podeAbrir(caminho, perfil) ? caminho : '/')
    // E a tela abriu de fato, sem cair no erro do router
    expect(screen.queryByText(/Unexpected Application Error/)).not.toBeInTheDocument()
  })
})
