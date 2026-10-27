import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FormAgendamento } from './FormAgendamento'

function Detalhe() {
  return <p>{(useLocation().state as { mensagem: string }).mensagem}</p>
}

const TIPOS = [
  { id: 3, nome: 'Hemograma completo', categoria: 'EXAME', pontosBase: 25 },
  { id: 4, nome: 'Urina tipo I (EAS)', categoria: 'EXAME', pontosBase: 20 },
  { id: 9, nome: 'Consulta puerperal', categoria: 'CONSULTA', pontosBase: 50 },
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

function responder(statusDoPost = 201) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (_, init) =>
    init?.method === 'POST'
      ? new Response(JSON.stringify({ id: 1, tipo: 'Hemograma completo', categoria: 'EXAME' }), {
          status: statusDoPost,
        })
      : new Response(JSON.stringify(TIPOS)),
  )
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

afterEach(() => {
  vi.restoreAllMocks()
})

describe('FormAgendamento', () => {
  it('cadastra para a gestante da rota com o tipo escolhido', async () => {
    const fetch = responder()
    renderizar()

    // A categoria filtra a lista de tipos: escolhido "Exame", a consulta some
    await userEvent.selectOptions(await screen.findByLabelText('Categoria'), 'EXAME')
    expect(screen.queryByRole('option', { name: 'Consulta puerperal' })).not.toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Exame ou consulta'), '3')
    await userEvent.type(screen.getByLabelText('Data prevista'), amanha())
    await userEvent.type(screen.getByLabelText('Observação'), 'Jejum de 8h')
    await userEvent.click(screen.getByRole('button', { name: /cadastrar/i }))

    const envio = fetch.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(envio?.[0]).toMatch(/\/agendamentos$/)
    expect(JSON.parse(String(envio?.[1]?.body))).toEqual({
      gestante: 7,
      tipoAtendimento: 3,
      dataPrevista: amanha(),
      observacao: 'Jejum de 8h',
    })
    expect(
      await screen.findByText('Hemograma completo cadastrado com sucesso.'),
    ).toBeInTheDocument()
  })

  it('exige tipo e data, e recusa data no passado, sem chamar a API', async () => {
    const fetch = responder()
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: /cadastrar/i }))
    expect(screen.getByText('Escolha o exame ou a consulta.')).toBeInTheDocument()
    expect(screen.getByText('Informe a data prevista.')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Data prevista'), ontem())
    await userEvent.click(screen.getByRole('button', { name: /cadastrar/i }))
    expect(screen.getByText('A data não pode ser no passado.')).toBeInTheDocument()

    expect(fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('envia sem observação quando ela fica em branco', async () => {
    const fetch = responder()
    renderizar()

    await userEvent.selectOptions(await screen.findByLabelText('Exame ou consulta'), '9')
    await userEvent.type(screen.getByLabelText('Data prevista'), amanha())
    await userEvent.click(screen.getByRole('button', { name: /cadastrar/i }))

    const envio = fetch.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toEqual({
      gestante: 7,
      tipoAtendimento: 9,
      dataPrevista: amanha(),
    })
  })

  it('mostra erro quando o servidor recusa os dados', async () => {
    responder(400)
    renderizar()

    await userEvent.selectOptions(await screen.findByLabelText('Exame ou consulta'), '3')
    await userEvent.type(screen.getByLabelText('Data prevista'), amanha())
    await userEvent.click(screen.getByRole('button', { name: /cadastrar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O servidor não aceitou os dados. Confira os campos e tente novamente.',
    )
  })
})
