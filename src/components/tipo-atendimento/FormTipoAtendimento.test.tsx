import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { TipoAtendimento } from './categorias'
import { FormTipoAtendimento } from './FormTipoAtendimento'

function Lista() {
  return <p>{(useLocation().state as { mensagem: string }).mensagem}</p>
}

const TIPO: TipoAtendimento = {
  id: 10,
  nome: 'Ultrassom 4D',
  categoria: 'EXAME',
  pontosBase: 30,
  ativo: true,
  padrao: false,
}

function renderizar(tipo?: TipoAtendimento) {
  render(
    <MemoryRouter initialEntries={['/form']}>
      <Routes>
        <Route path="/form" element={<FormTipoAtendimento tipo={tipo} />} />
        <Route path="/tipos-atendimento" element={<Lista />} />
      </Routes>
    </MemoryRouter>,
  )
}

function responder(status: number) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status }))
}

async function cadastrar(pontos = '30') {
  await userEvent.type(screen.getByLabelText('Nome'), '  Ultrassom 4D  ')
  await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'EXAME')
  await userEvent.type(screen.getByLabelText('Pontuação'), pontos)
  await userEvent.click(screen.getByRole('button', { name: 'Cadastrar tipo' }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('FormTipoAtendimento', () => {
  it('mostra o erro de cada campo ao enviar vazio, sem chamar a API', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    renderizar()

    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar tipo' }))

    expect(screen.getByText('Informe o nome do tipo.')).toBeInTheDocument()
    expect(screen.getByText('Escolha se é exame ou consulta.')).toBeInTheDocument()
    expect(screen.getByText('Informe a pontuação.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveFocus()
    // Cadastro não tem o que excluir
    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each(['0', '1001', '2.5'])('recusa a pontuação %s', async (pontos) => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    renderizar()

    await cadastrar(pontos)

    expect(screen.getByText('Informe um número inteiro de 1 a 1000.')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('cadastra com o nome sem espaços nas pontas e confirma na lista', async () => {
    const fetch = responder(201)
    renderizar()

    await cadastrar()

    expect(await screen.findByText('Tipo Ultrassom 4D cadastrado com sucesso.')).toBeInTheDocument()
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body)).nome).toBe('Ultrassom 4D')
  })

  it.each([
    [409, 'Já existe um tipo seu com esse nome.'],
    [400, 'O servidor não aceitou os dados. Confira os campos e tente novamente.'],
    [404, 'Tipo não encontrado. Volte à lista e abra o tipo de novo.'],
    [500, 'Não foi possível salvar. Verifique sua conexão e tente novamente.'],
  ])('ao salvar com resposta %i, avisa e libera o botão', async (status, mensagem) => {
    responder(status)
    renderizar()

    await cadastrar()

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagem)
    expect(screen.getByRole('button', { name: 'Cadastrar tipo' })).toBeEnabled()
  })

  it('exclui o tipo ainda não usado e volta à lista', async () => {
    const fetch = responder(200)
    renderizar(TIPO)

    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    expect(await screen.findByText('Tipo Ultrassom 4D excluído com sucesso.')).toBeInTheDocument()
    expect(fetch.mock.calls[0]?.[0]).toMatch(/\/tipos-atendimento\/10$/)
    expect(fetch.mock.calls[0]?.[1]?.method).toBe('DELETE')
  })

  it('avisa quando não consegue excluir e libera os botões', async () => {
    responder(500)
    renderizar(TIPO)

    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar.')
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeEnabled()
  })
})
