import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FormCupom } from './FormCupom'

function Lista() {
  return <p>{(useLocation().state as { mensagem: string }).mensagem}</p>
}

const PRODUTOS = [
  { id: 10, nome: 'Fralda RN', preco: 39.9 },
  { id: 11, nome: 'Body de algodão' },
]

// GET devolve os produtos da empresa; POST devolve o cupom com a descrição montada pelo backend
function responder(produtos: unknown[]) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (_, init) =>
    init?.method === 'POST'
      ? new Response(JSON.stringify({ descricao: '10% de desconto em Fralda RN' }), { status: 201 })
      : new Response(
          JSON.stringify({
            itens: produtos,
            pagina: 0,
            tamanho: 100,
            total: produtos.length,
            totalPaginas: 1,
          }),
        ),
  )
}

function renderizar() {
  render(
    <MemoryRouter initialEntries={['/form']}>
      <Routes>
        <Route path="/form" element={<FormCupom />} />
        <Route path="/cupons" element={<Lista />} />
      </Routes>
    </MemoryRouter>,
  )
}

const daquiA30Dias = () => {
  const data = new Date()
  data.setDate(data.getDate() + 30)
  return data.toLocaleDateString('sv-SE')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('FormCupom', () => {
  it('cadastra para o produto escolhido, sem categoria, descrição nem quantidade', async () => {
    const fetch = responder(PRODUTOS)
    renderizar()

    // Pelo valor: o preço formatado tem espaço não separável depois do R$
    await userEvent.selectOptions(await screen.findByLabelText('Produto'), '10')
    expect(screen.getByRole('option', { name: /fralda rn \(r\$\s39,90\)/i })).toBeInTheDocument()
    expect(screen.queryByLabelText('Categoria')).not.toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Desconto (%)'), '10')
    await userEvent.type(screen.getByLabelText('Validade'), daquiA30Dias())
    await userEvent.type(screen.getByLabelText('Pontos para resgatar'), '200')
    await userEvent.click(screen.getByRole('button', { name: /cadastrar cupom/i }))

    const envio = fetch.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(envio?.[0]).toMatch(/\/empresas\/cupons$/)
    expect(JSON.parse(String(envio?.[1]?.body))).toEqual({
      produto: 10,
      desconto: 10,
      dataValidade: daquiA30Dias(),
      pontosNecessarios: 200,
    })
    expect(
      await screen.findByText('Cupom “10% de desconto em Fralda RN” cadastrado com sucesso.'),
    ).toBeInTheDocument()
  })

  it('exige o produto e pontos inteiros, sem chamar a API para salvar', async () => {
    const fetch = responder(PRODUTOS)
    renderizar()

    await userEvent.type(await screen.findByLabelText('Pontos para resgatar'), '1,5')
    await userEvent.click(screen.getByRole('button', { name: /cadastrar cupom/i }))

    expect(screen.getByText('Escolha o produto.')).toBeInTheDocument()
    expect(screen.getByText('Informe o desconto.')).toBeInTheDocument()
    expect(screen.getByText('Informe um número inteiro maior que zero.')).toBeInTheDocument()

    // Escolher na lista já tira o erro
    await userEvent.selectOptions(screen.getByLabelText('Produto'), '11')
    expect(screen.queryByText('Escolha o produto.')).not.toBeInTheDocument()
    expect(fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('sem produtos cadastrados, leva ao cadastro de produto', async () => {
    responder([])
    renderizar()

    expect(await screen.findByRole('link', { name: /cadastrar produto/i })).toHaveAttribute(
      'href',
      '/produtos/novo',
    )
    expect(screen.queryByRole('button', { name: /cadastrar cupom/i })).not.toBeInTheDocument()
  })
})
