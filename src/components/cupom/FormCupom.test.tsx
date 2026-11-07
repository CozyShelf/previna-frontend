import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FormCupom, type Cupom } from './FormCupom'

function Lista() {
  return <p>{(useLocation().state as { mensagem: string }).mensagem}</p>
}

const PRODUTOS = [
  { id: 10, nome: 'Fralda RN', preco: 39.9 },
  { id: 11, nome: 'Body de algodão' },
]

// GET devolve os produtos da empresa; POST e PUT devolvem o cupom com a descrição montada pelo backend
function responder(produtos: unknown[]) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (_, init) =>
    init?.method === 'POST' || init?.method === 'PUT'
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

function renderizar(cupom?: Cupom) {
  render(
    <MemoryRouter initialEntries={['/form']}>
      <Routes>
        <Route path="/form" element={<FormCupom cupom={cupom} />} />
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

  it('na edição, traz os dados do cupom e salva com PUT, sem a situação', async () => {
    const fetch = responder(PRODUTOS)
    renderizar({
      id: 7,
      descricao: '12,5% de desconto em Body de algodão',
      produto: 'Body de algodão',
      idProduto: 11,
      desconto: 12.5,
      dataValidade: daquiA30Dias(),
      pontosNecessarios: 200,
      ativo: false,
    })

    expect(await screen.findByLabelText('Produto')).toHaveValue('11')
    expect(screen.getByLabelText('Desconto (%)')).toHaveValue('12,5')
    await userEvent.clear(screen.getByLabelText('Pontos para resgatar'))
    await userEvent.type(screen.getByLabelText('Pontos para resgatar'), '300')
    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }))

    const envio = fetch.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(envio?.[0]).toMatch(/\/empresas\/cupons\/7$/)
    expect(JSON.parse(String(envio?.[1]?.body))).toEqual({
      produto: 11,
      desconto: 12.5,
      dataValidade: daquiA30Dias(),
      pontosNecessarios: 300,
    })
    expect(await screen.findByText(/atualizado com sucesso/)).toBeInTheDocument()
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

  it('avisa quando não consegue carregar os produtos', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 500 }))
    renderizar()

    expect(screen.getByText('Carregando produtos…')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar os produtos.',
    )
  })

  it('recusa validade no passado e pontos zerados', async () => {
    const fetch = responder(PRODUTOS)
    renderizar()

    await userEvent.selectOptions(await screen.findByLabelText('Produto'), '10')
    await userEvent.type(screen.getByLabelText('Desconto (%)'), '10')
    await userEvent.type(screen.getByLabelText('Validade'), '2000-01-01')
    await userEvent.type(screen.getByLabelText('Pontos para resgatar'), '0')
    await userEvent.click(screen.getByRole('button', { name: /cadastrar cupom/i }))

    expect(screen.getByText('A validade já passou.')).toBeInTheDocument()
    expect(screen.getByText('Informe um número inteiro maior que zero.')).toBeInTheDocument()
    expect(fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('pede a validade e os pontos quando ficam vazios', async () => {
    responder(PRODUTOS)
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: /cadastrar cupom/i }))

    expect(screen.getByText('Informe a validade.')).toBeInTheDocument()
    expect(screen.getByText('Informe os pontos necessários.')).toBeInTheDocument()
  })

  it.each([
    [400, 'O servidor não aceitou os dados. Confira a validade e o produto e tente novamente.'],
    [500, 'Não foi possível salvar. Verifique sua conexão e tente novamente.'],
  ])('com resposta %i ao salvar, avisa e libera o botão', async (status, mensagem) => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_, init) =>
      init?.method === 'POST'
        ? new Response('{}', { status })
        : new Response(
            JSON.stringify({ itens: PRODUTOS, pagina: 0, tamanho: 100, total: 2, totalPaginas: 1 }),
          ),
    )
    renderizar()

    await userEvent.selectOptions(await screen.findByLabelText('Produto'), '11')
    expect(screen.getByRole('option', { name: 'Body de algodão' })).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Desconto (%)'), '10')
    await userEvent.type(screen.getByLabelText('Validade'), daquiA30Dias())
    await userEvent.type(screen.getByLabelText('Pontos para resgatar'), '200')
    await userEvent.click(screen.getByRole('button', { name: /cadastrar cupom/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagem)
    expect(screen.getByRole('button', { name: /cadastrar cupom/i })).toBeEnabled()
  })
})
