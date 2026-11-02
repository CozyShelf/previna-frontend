import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FormAgendamento } from './FormAgendamento'

function Detalhe() {
  return <p>{(useLocation().state as { mensagem: string }).mensagem}</p>
}

const TIPOS = [
  {
    id: 3,
    nome: 'Hemograma completo',
    categoria: 'EXAME',
    pontosBase: 25,
    ativo: true,
    padrao: true,
  },
  {
    id: 4,
    nome: 'Urina tipo I (EAS)',
    categoria: 'EXAME',
    pontosBase: 20,
    ativo: true,
    padrao: true,
  },
  {
    id: 9,
    nome: 'Consulta puerperal',
    categoria: 'CONSULTA',
    pontosBase: 50,
    ativo: true,
    padrao: true,
  },
]

const amanha = () => {
  const data = new Date()
  data.setDate(data.getDate() + 1)
  return data.toLocaleDateString('sv-SE')
}

const ontem = () => {
  const data = new Date()
  data.setDate(data.getDate() - 1)
  return data.toLocaleDateString('sv-SE')
}

// O POST devolve um agendamento por item enviado
function responder(statusDoPost = 201) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
    if (init?.method !== 'POST') return new Response(JSON.stringify(TIPOS))
    const enviados = JSON.parse(String(init.body)).itens as { tipoAtendimento: number }[]
    return new Response(
      JSON.stringify(
        enviados.map((item) => ({
          id: item.tipoAtendimento,
          tipo: TIPOS.find((tipo) => tipo.id === item.tipoAtendimento)?.nome,
        })),
      ),
      { status: statusDoPost },
    )
  })
}

function renderizar() {
  render(
    <MemoryRouter initialEntries={['/gestantes/7/agendamentos/novo']}>
      <Routes>
        <Route path="/gestantes/:id/agendamentos/novo" element={<FormAgendamento />} />
        <Route path="/gestantes/:id" element={<Detalhe />} />
      </Routes>
    </MemoryRouter>,
  )
}

const corpoEnviado = (fetch: ReturnType<typeof responder>) =>
  JSON.parse(String(fetch.mock.calls.find(([, init]) => init?.method === 'POST')?.[1]?.body))

const adicionar = () => screen.getByRole('button', { name: /adicionar exame ou consulta/i })

afterEach(() => {
  vi.restoreAllMocks()
})

describe('FormAgendamento', () => {
  // A categoria virou rótulo da opção; não existe mais o filtro cuja opção vazia parecia uma terceira categoria
  it('mostra a categoria no rótulo de cada opção, sem filtro de categoria', async () => {
    responder()
    renderizar()

    const tipo = await screen.findByLabelText('Exame ou consulta')
    expect(
      within(tipo).getByRole('option', { name: 'Exame · Hemograma completo (25 pontos)' }),
    ).toBeInTheDocument()
    expect(
      within(tipo).getByRole('option', { name: 'Consulta · Consulta puerperal (50 pontos)' }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Categoria')).not.toBeInTheDocument()
  })

  it('cadastra para a gestante da rota com o tipo escolhido', async () => {
    const fetch = responder()
    renderizar()

    await userEvent.selectOptions(await screen.findByLabelText('Exame ou consulta'), '3')
    await userEvent.type(screen.getByLabelText('Data prevista'), amanha())
    await userEvent.type(screen.getByLabelText('Observação'), 'Jejum de 8h')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    const envio = fetch.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(envio?.[0]).toMatch(/\/agendamentos$/)
    expect(JSON.parse(String(envio?.[1]?.body))).toEqual({
      gestante: 7,
      itens: [{ tipoAtendimento: 3, dataPrevista: amanha(), observacao: 'Jejum de 8h' }],
    })
    expect(
      await screen.findByText('Cadastro de Hemograma completo realizado com sucesso.'),
    ).toBeInTheDocument()
  })

  // Opção escolhida: cada linha do formulário vira um exame ou consulta próprio
  it('envia um item por linha adicionada, cada um com o seu tipo e a sua data', async () => {
    const fetch = responder()
    renderizar()

    await userEvent.selectOptions(await screen.findByLabelText('Exame ou consulta'), '3')
    await userEvent.type(screen.getByLabelText('Data prevista'), amanha())

    await userEvent.click(adicionar())
    await userEvent.selectOptions(screen.getAllByLabelText('Exame ou consulta')[1]!, '9')
    await userEvent.type(screen.getAllByLabelText('Data prevista')[1]!, '2027-01-20')

    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(corpoEnviado(fetch)).toEqual({
      gestante: 7,
      itens: [
        { tipoAtendimento: 3, dataPrevista: amanha() },
        { tipoAtendimento: 9, dataPrevista: '2027-01-20' },
      ],
    })
    expect(
      await screen.findByText('Cadastro de 2 exames e consultas realizado com sucesso.'),
    ).toBeInTheDocument()
  })

  it('remove uma linha sem embaralhar o que já foi preenchido nas outras', async () => {
    const fetch = responder()
    renderizar()

    await userEvent.selectOptions(await screen.findByLabelText('Exame ou consulta'), '3')
    await userEvent.type(screen.getByLabelText('Data prevista'), amanha())
    await userEvent.click(adicionar())
    await userEvent.click(screen.getAllByRole('button', { name: 'Remover' })[1]!)

    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(corpoEnviado(fetch).itens).toEqual([{ tipoAtendimento: 3, dataPrevista: amanha() }])
  })

  it('exige tipo e data, e recusa data no passado, sem chamar a API', async () => {
    const fetch = responder()
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Cadastrar' }))
    expect(screen.getByText('Escolha o exame ou a consulta.')).toBeInTheDocument()
    expect(screen.getByText('Informe a data prevista.')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Data prevista'), ontem())
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))
    expect(screen.getByText('A data não pode ser no passado.')).toBeInTheDocument()

    expect(fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  // Uma linha incompleta no meio do cadastro não pode passar despercebida
  it('cobra o tipo e a data de cada linha antes de enviar', async () => {
    const fetch = responder()
    renderizar()

    await userEvent.selectOptions(await screen.findByLabelText('Exame ou consulta'), '3')
    await userEvent.type(screen.getByLabelText('Data prevista'), amanha())
    await userEvent.click(adicionar())
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(screen.getByText('Escolha o exame ou a consulta.')).toBeInTheDocument()
    expect(screen.getByText('Informe a data prevista.')).toBeInTheDocument()
    expect(fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('envia sem observação quando ela fica em branco', async () => {
    const fetch = responder()
    renderizar()

    await userEvent.selectOptions(await screen.findByLabelText('Exame ou consulta'), '9')
    await userEvent.type(screen.getByLabelText('Data prevista'), amanha())
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(corpoEnviado(fetch)).toEqual({
      gestante: 7,
      itens: [{ tipoAtendimento: 9, dataPrevista: amanha() }],
    })
  })

  it('mostra erro quando o servidor recusa os dados', async () => {
    responder(400)
    renderizar()

    await userEvent.selectOptions(await screen.findByLabelText('Exame ou consulta'), '3')
    await userEvent.type(screen.getByLabelText('Data prevista'), amanha())
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O servidor não aceitou os dados. Confira os campos e tente novamente.',
    )
  })
})
