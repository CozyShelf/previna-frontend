import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { GestantePage } from './GestantePage'

const GESTANTE = {
  id: 7,
  nome: 'Maria Teste',
  cpf: '52998224725',
  telefone: '11999998888',
  email: 'maria@exemplo.com',
  dataNascimento: '1995-04-10',
  dum: '2026-06-01',
  dataProvavelParto: '2027-03-08',
  saldoPontos: 25,
  primeiroAcessoPendente: false,
  medico: 'Médico Teste',
}

const AGENDAMENTOS = [
  {
    id: 1,
    tipo: 'Hemograma completo',
    categoria: 'EXAME',
    pontosBase: 25,
    dataPrevista: '2026-11-10',
    status: 'AGENDADO',
  },
]

const PENDENTE_E_REALIZADO = [
  {
    id: 12,
    tipo: 'Hemograma completo',
    categoria: 'EXAME',
    pontosBase: 25,
    dataPrevista: '2026-11-10',
    status: 'AGENDADO',
  },
  {
    id: 20,
    tipo: 'Consulta puerperal',
    categoria: 'CONSULTA',
    pontosBase: 50,
    dataPrevista: '2026-10-01',
    status: 'REALIZADO',
    dataConfirmacao: '2026-10-01T10:00:00',
  },
]

// GET devolve a lista; o PUT devolve o item resolvido, no formato de cada rota
function responderComAcoes(statusDoPut = 200) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
    const caminho = String(url)
    if (init?.method === 'PUT') {
      if (statusDoPut !== 200) return new Response('{}', { status: statusDoPut })
      const resolvido = { ...PENDENTE_E_REALIZADO[0] }
      return caminho.endsWith('/confirmar')
        ? new Response(
            JSON.stringify({
              agendamento: { ...resolvido, status: 'REALIZADO' },
              pontosCreditados: 25,
              saldoPontos: 125,
            }),
          )
        : new Response(JSON.stringify({ ...resolvido, status: 'NAO_COMPARECEU' }))
    }
    return caminho.endsWith('/agendamentos')
      ? new Response(JSON.stringify(PENDENTE_E_REALIZADO))
      : new Response(JSON.stringify(GESTANTE))
  })
}

// A página faz duas chamadas: os dados da gestante e a lista de agendamentos
function responder(agendamentos: unknown[], status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    if (status !== 200) return new Response('{}', { status })
    return String(url).endsWith('/agendamentos')
      ? new Response(JSON.stringify(agendamentos))
      : new Response(JSON.stringify(GESTANTE))
  })
}

function renderizar(state?: { mensagem: string }) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/gestantes/7', state }]}>
      <Routes>
        <Route path="/gestantes/:id" element={<GestantePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('GestantePage', () => {
  it('mostra os dados da gestante e os seus agendamentos', async () => {
    responder(AGENDAMENTOS)
    renderizar()

    expect(await screen.findByRole('heading', { name: 'Maria Teste', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('529.982.247-25')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(await screen.findByText('Hemograma completo')).toBeInTheDocument()
  })

  it('mostra o estado vazio e o link de cadastro quando não há nenhum agendamento', async () => {
    responder([])
    renderizar()

    expect(await screen.findByText(/nenhum exame ou consulta cadastrado/i)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /cadastrar exame ou consulta/i })[0]).toHaveAttribute(
      'href',
      '/gestantes/7/agendamentos/novo',
    )
  })

  it('avisa sem quebrar quando a API falha', async () => {
    responder([], 404)
    renderizar()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar a gestante. Recarregue a página para tentar de novo.',
    )
  })

  it('confirma a realização e move o item para os realizados', async () => {
    const fetch = responderComAcoes()
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: /confirmar realização/i }))

    const envio = fetch.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(envio?.[0]).toMatch(/\/agendamentos\/12\/confirmar$/)
    expect(
      await screen.findByText(/presença confirmada e 25 pontos creditados/i),
    ).toBeInTheDocument()

    const realizados = screen.getByRole('region', { name: 'Realizados' })
    expect(within(realizados).getByText('Hemograma completo')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Pendentes' })).not.toBeInTheDocument()
  })

  it('registra o não comparecimento sem falar em pontos', async () => {
    const fetch = responderComAcoes()
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: /não compareceu/i }))

    const envio = fetch.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(envio?.[0]).toMatch(/\/agendamentos\/12\/nao-compareceu$/)
    const aviso = await screen.findByRole('status')
    expect(aviso).toHaveTextContent('Não comparecimento registrado.')
    expect(aviso.textContent).not.toMatch(/pontos/i)
  })

  it('só oferece as ações nos pendentes', async () => {
    responderComAcoes()
    renderizar()

    const realizados = await screen.findByRole('region', { name: 'Realizados' })
    expect(
      within(realizados).queryByRole('button', { name: /confirmar realização/i }),
    ).not.toBeInTheDocument()
    expect(within(realizados).queryByRole('button', { name: /não compareceu/i })).not.toBeInTheDocument()
  })

  it('avisa quando o item já foi resolvido em outra aba', async () => {
    responderComAcoes(409)
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: /confirmar realização/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este exame ou consulta já foi resolvido. Recarregue a página.',
    )
  })

  // O formulário de cadastro navega para cá com a confirmação no state, como as outras listas do sistema
  it('mostra a confirmação deixada pelo formulário de cadastro', async () => {
    responder(AGENDAMENTOS)
    renderizar({ mensagem: 'Cadastro de Hemograma completo realizado com sucesso.' })

    expect(
      await screen.findByText('Cadastro de Hemograma completo realizado com sucesso.'),
    ).toBeInTheDocument()
  })
})
