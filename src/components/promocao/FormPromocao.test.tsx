import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FormPromocao, type Promocao } from './FormPromocao'

function Lista() {
  return <p>{(useLocation().state as { mensagem: string }).mensagem}</p>
}

function renderizar(promocao?: Promocao) {
  render(
    <MemoryRouter initialEntries={['/form']}>
      <Routes>
        <Route path="/form" element={<FormPromocao promocao={promocao} />} />
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

  it('na edição, traz os dados da promoção e salva com PUT', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
    renderizar({
      id: 3,
      titulo: 'Semana do bebê',
      descricao: 'Só esta semana',
      desconto: 12.5,
      dataInicio: dataLocal(-2),
      dataFim: dataLocal(7),
      categoria: 'ROUPAS',
    })

    expect(screen.getByLabelText('Categoria')).toHaveValue('ROUPAS')
    expect(screen.getByLabelText('Desconto (%)')).toHaveValue('12,5')
    // Apagada, a descrição não vai e o backend a grava nula
    await userEvent.clear(screen.getByLabelText('Descrição'))
    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }))

    expect(fetch.mock.calls[0]?.[0]).toMatch(/\/empresas\/promocoes\/3$/)
    expect(fetch.mock.calls[0]?.[1]?.method).toBe('PUT')
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
      titulo: 'Semana do bebê',
      desconto: 12.5,
      dataInicio: dataLocal(-2),
      dataFim: dataLocal(7),
      categoria: 'ROUPAS',
    })
    expect(
      await screen.findByText('Promoção Semana do bebê atualizada com sucesso.'),
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

  async function preencher(inicio: string, fim: string) {
    await userEvent.type(screen.getByLabelText('Título'), 'Semana do bebê')
    await userEvent.type(screen.getByLabelText('Descrição'), 'Só nesta semana')
    await userEvent.type(screen.getByLabelText('Desconto (%)'), '15')
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'Roupas')
    await userEvent.type(screen.getByLabelText('Início'), inicio)
    await userEvent.type(screen.getByLabelText('Fim'), fim)
    await userEvent.click(screen.getByRole('button', { name: /cadastrar promoção/i }))
  }

  it('pede título, desconto e as datas quando ficam vazios', async () => {
    renderizar()

    await userEvent.click(screen.getByRole('button', { name: /cadastrar promoção/i }))

    expect(screen.getByText('Informe o título da promoção.')).toBeInTheDocument()
    expect(screen.getByText('Informe a data de início.')).toBeInTheDocument()
    expect(screen.getByText('Informe a data de fim.')).toBeInTheDocument()
  })

  it('recusa uma vigência que já terminou', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    renderizar()

    await preencher(dataLocal(-10), dataLocal(-1))

    expect(screen.getByText('A data de fim já passou.')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('envia a descrição quando preenchida', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 201 }))
    renderizar()

    await preencher(dataLocal(0), dataLocal(0))

    expect(await screen.findByText(/cadastrada com sucesso/)).toBeInTheDocument()
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toMatchObject({
      descricao: 'Só nesta semana',
      categoria: 'ROUPAS',
    })
  })

  it.each([
    [400, 'O servidor não aceitou os dados. Confira o período e a categoria e tente novamente.'],
    [500, 'Não foi possível salvar. Verifique sua conexão e tente novamente.'],
  ])('com resposta %i ao salvar, avisa e libera o botão', async (status, mensagem) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status }))
    renderizar()

    await preencher(dataLocal(0), dataLocal(3))

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagem)
    expect(screen.getByRole('button', { name: /cadastrar promoção/i })).toBeEnabled()
  })
})
