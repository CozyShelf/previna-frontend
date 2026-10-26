import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FormPromocao } from './FormPromocao'

function Lista() {
  return <p>{(useLocation().state as { mensagem: string }).mensagem}</p>
}

function renderizar() {
  render(
    <MemoryRouter initialEntries={['/form']}>
      <Routes>
        <Route path="/form" element={<FormPromocao />} />
        <Route path="/promocoes" element={<Lista />} />
      </Routes>
    </MemoryRouter>,
  )
}

const dataLocal = (dias: number) => {
  const data = new Date()
  data.setDate(data.getDate() + dias)
  return data.toLocaleDateString('sv-SE')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('FormPromocao', () => {
  it('cadastra para a categoria escolhida e volta para a lista', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({}), { status: 201 }))
    renderizar()

    await userEvent.type(screen.getByLabelText('Título'), 'Semana do bebê')
    await userEvent.type(screen.getByLabelText('Desconto (%)'), '12,5')
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'Fraldas')
    await userEvent.type(screen.getByLabelText('Início'), dataLocal(0))
    await userEvent.type(screen.getByLabelText('Fim'), dataLocal(7))
    await userEvent.click(screen.getByRole('button', { name: /cadastrar promoção/i }))

    expect(fetch.mock.calls[0]?.[0]).toMatch(/\/empresas\/promocoes$/)
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
      titulo: 'Semana do bebê',
      desconto: 12.5,
      dataInicio: dataLocal(0),
      dataFim: dataLocal(7),
      categoria: 'FRALDAS',
    })
    expect(
      await screen.findByText('Promoção Semana do bebê cadastrada com sucesso.'),
    ).toBeInTheDocument()
  })

  it('exige a categoria e o fim depois do início, sem chamar a API', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    renderizar()

    await userEvent.type(screen.getByLabelText('Título'), 'Semana do bebê')
    await userEvent.type(screen.getByLabelText('Desconto (%)'), '150')
    await userEvent.type(screen.getByLabelText('Início'), dataLocal(7))
    await userEvent.type(screen.getByLabelText('Fim'), dataLocal(6))
    await userEvent.click(screen.getByRole('button', { name: /cadastrar promoção/i }))

    expect(
      screen.getByText('Informe um percentual maior que 0 e até 100, como 15 ou 12,5.'),
    ).toBeInTheDocument()
    expect(screen.getByText('O fim deve ser no mesmo dia do início ou depois.')).toBeInTheDocument()
    expect(screen.getByText('Escolha a categoria.')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })
})
