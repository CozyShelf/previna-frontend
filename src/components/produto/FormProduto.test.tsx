import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FormProduto, type Produto } from './FormProduto'

function Lista() {
  return <p>{(useLocation().state as { mensagem: string }).mensagem}</p>
}

function renderizar(produto?: Produto) {
  render(
    <MemoryRouter initialEntries={['/form']}>
      <Routes>
        <Route path="/form" element={<FormProduto produto={produto} />} />
        <Route path="/produtos" element={<Lista />} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('FormProduto', () => {
  it('exige o nome e recusa preço fora do formato, sem chamar a API', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    renderizar()

    await userEvent.type(screen.getByLabelText('Preço sem desconto (R$)'), '1.234,56')
    await userEvent.click(screen.getByRole('button', { name: /cadastrar produto/i }))

    expect(screen.getByText('Informe o nome do produto.')).toBeInTheDocument()
    expect(
      screen.getByText('Informe o preço em reais, só com a vírgula dos centavos, como 39,90.'),
    ).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('envia em multipart, com o preço com ponto, e volta para a lista', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 201 }))
    renderizar()

    await userEvent.type(screen.getByLabelText('Nome'), 'Fralda RN')
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'Fraldas')
    await userEvent.type(screen.getByLabelText('Preço sem desconto (R$)'), '39,90')
    await userEvent.click(screen.getByRole('button', { name: /cadastrar produto/i }))

    expect(fetch.mock.calls[0]?.[0]).toMatch(/\/empresas\/produtos$/)
    expect(fetch.mock.calls[0]?.[1]?.method).toBe('POST')
    const corpo = fetch.mock.calls[0]?.[1]?.body as FormData
    expect(corpo.get('nome')).toBe('Fralda RN')
    expect(corpo.get('categoria')).toBe('FRALDAS')
    expect(corpo.get('preco')).toBe('39.90')
    // Sem imagem nem descrição, os campos não vão
    expect(corpo.has('imagem')).toBe(false)
    expect(corpo.has('descricao')).toBe(false)
    expect(await screen.findByText('Produto Fralda RN cadastrado com sucesso.')).toBeInTheDocument()
  })

  it('edita com os dados atuais e manda PUT sem imagem quando ela não é trocada', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ id: 5 }), { status: 200 }))
    renderizar({
      id: 5,
      nome: 'Fralda RN',
      categoria: 'FRALDAS',
      preco: 39.9,
      imagemUrl: '/empresas/produtos/5/imagem?v=1',
    })

    expect(screen.getByLabelText('Preço sem desconto (R$)')).toHaveValue('39,90')
    expect(screen.getByLabelText('Categoria')).toHaveValue('FRALDAS')
    const nome = screen.getByLabelText('Nome')
    await userEvent.clear(nome)
    await userEvent.type(nome, 'Fralda P')
    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }))

    expect(fetch.mock.calls[0]?.[0]).toMatch(/\/empresas\/produtos\/5$/)
    expect(fetch.mock.calls[0]?.[1]?.method).toBe('PUT')
    const corpo = fetch.mock.calls[0]?.[1]?.body as FormData
    expect(corpo.get('nome')).toBe('Fralda P')
    expect(corpo.get('preco')).toBe('39.90')
    expect(corpo.get('categoria')).toBe('FRALDAS')
    expect(corpo.has('imagem')).toBe(false)
    expect(await screen.findByText('Produto Fralda P atualizado com sucesso.')).toBeInTheDocument()
  })
})
