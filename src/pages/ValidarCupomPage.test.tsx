import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { formatarDataHora } from '@/lib/datas'
import { ValidarCupomPage } from '@/pages/ValidarCupomPage'
import { cliqueDuplo, escritas } from '@/test/cliqueDuplo'

// Instantes montados na hora local, para o texto esperado não depender do fuso da máquina
const RESGATADO_EM = new Date(2026, 10, 10, 8, 30).toISOString()
const USADO_EM = new Date(2026, 10, 19, 14, 5).toISOString()

const CUPOM = {
  id: 3,
  tipo: 'CUPOM',
  codigo: 'ABCD2345',
  titulo: null,
  produtoNome: 'Fralda RN',
  categoria: 'FRALDAS',
  desconto: 10,
  validade: '2026-12-31',
  dataResgate: RESGATADO_EM,
  dataUso: USADO_EM,
  gestanteNome: 'Maria Souza',
}

const PROMOCAO = {
  ...CUPOM,
  id: 4,
  tipo: 'PROMOCAO',
  codigo: 'PRMO7788',
  titulo: 'Semana do bebê',
  produtoNome: null,
  categoria: 'ROUPAS',
  desconto: 12.5,
}

// Cada chamada ao fetch devolve o próximo corpo/status da fila
function responder(...respostas: { status?: number; corpo: unknown }[]) {
  const fetch = vi.spyOn(globalThis, 'fetch')
  for (const { status = 200, corpo } of respostas) {
    fetch.mockResolvedValueOnce(new Response(JSON.stringify(corpo), { status }))
  }
  return fetch
}

// Promessa resolvida de fora, para segurar a validação "em voo"
function pendente() {
  let resolver!: (resposta: Response) => void
  const promessa = new Promise<Response>((r) => (resolver = r))
  return { promessa, resolver }
}

function renderizar() {
  render(<ValidarCupomPage />)
  return screen.getByRole('textbox', { name: 'Código' })
}

const resultado = () => screen.findByRole('status', { name: 'Resultado da validação' })
const erro = () => screen.findByRole('alert', { name: 'Resultado da validação' })
const corpoEnviado = (fetch: ReturnType<typeof responder>, i = 0) =>
  JSON.parse(String(fetch.mock.calls[i]?.[1]?.body))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ValidarCupomPage', () => {
  it('abre com o foco no campo do código', () => {
    const campo = renderizar()

    expect(campo).toHaveFocus()
  })

  it('valida um cupom e mostra os dados do resgate', async () => {
    const fetch = responder({ corpo: CUPOM })
    const campo = renderizar()

    await userEvent.type(campo, 'ABCD2345')
    await userEvent.click(screen.getByRole('button', { name: 'Validar' }))

    const card = within(await resultado())
    expect(card.getByText('Cupom validado')).toBeInTheDocument()
    expect(card.getByText('Tipo').nextSibling).toHaveTextContent('Cupom')
    expect(card.getByText('ABCD2345')).toBeInTheDocument()
    expect(card.getByText('Produto').nextSibling).toHaveTextContent('Fralda RN')
    expect(card.getByText('Categoria').nextSibling).toHaveTextContent('Fraldas')
    expect(card.getByText('Desconto').nextSibling).toHaveTextContent('10%')
    expect(card.getByText('Gestante').nextSibling).toHaveTextContent('Maria Souza')
    expect(card.getByText('Resgatado em').nextSibling).toHaveTextContent('10/11/2026 às 08:30')
    expect(card.getByText('Validade').nextSibling).toHaveTextContent('31/12/2026')
    expect(card.getByText('Validado em 19/11/2026 às 14:05')).toBeInTheDocument()
    expect(card.queryByText('Título')).not.toBeInTheDocument()

    const [caminho, init] = fetch.mock.calls[0]!
    expect(caminho).toMatch(/\/empresas\/cupons\/validar$/)
    expect(init?.method).toBe('POST')
    expect(corpoEnviado(fetch)).toEqual({ codigo: 'ABCD2345' })
  })

  it('valida uma promoção e mostra o título no lugar do produto', async () => {
    responder({ corpo: PROMOCAO })
    const campo = renderizar()

    await userEvent.type(campo, 'PRMO7788{Enter}')

    const card = within(await resultado())
    expect(card.getByText('Promoção validada')).toBeInTheDocument()
    expect(card.getByText('Tipo').nextSibling).toHaveTextContent('Promoção')
    expect(card.getByText('Título').nextSibling).toHaveTextContent('Semana do bebê')
    expect(card.getByText('Categoria').nextSibling).toHaveTextContent('Roupas')
    expect(card.getByText('Desconto').nextSibling).toHaveTextContent('12,5%')
    expect(card.queryByText('Produto')).not.toBeInTheDocument()
  })

  it('omite a categoria do cupom de produto sem categoria', async () => {
    responder({ corpo: { ...CUPOM, categoria: null } })
    const campo = renderizar()

    await userEvent.type(campo, 'ABCD2345{Enter}')

    const card = within(await resultado())
    expect(card.getByText('Produto')).toBeInTheDocument()
    expect(card.queryByText('Categoria')).not.toBeInTheDocument()
  })

  it('envia com Enter, como faz o leitor de código de barras ou QR', async () => {
    const fetch = responder({ corpo: CUPOM })
    const campo = renderizar()

    await userEvent.type(campo, 'ABCD2345{Enter}')

    expect(await resultado()).toBeInTheDocument()
    expect(escritas(fetch)).toHaveLength(1)
  })

  it('envia o código sem espaços nas pontas e em maiúsculas', async () => {
    const fetch = responder({ corpo: CUPOM })
    const campo = renderizar()

    await userEvent.type(campo, '  abcd2345 {Enter}')

    await resultado()
    expect(corpoEnviado(fetch)).toEqual({ codigo: 'ABCD2345' })
  })

  it('não envia o código vazio e pede para informar', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    const campo = renderizar()

    await userEvent.type(campo, '   {Enter}')

    expect(screen.getByText('Informe o código.')).toBeInTheDocument()
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveFocus()
    expect(fetch).not.toHaveBeenCalled()

    await userEvent.type(campo, 'A')
    expect(screen.queryByText('Informe o código.')).not.toBeInTheDocument()
  })

  it.each([
    [
      'inexistente ou de outra empresa',
      404,
      { message: 'Não encontrado', codigo: 'RESGATE_NAO_ENCONTRADO' },
      'Código não encontrado. Confira se foi digitado corretamente e se é de um cupom ou promoção da sua empresa.',
    ],
    [
      'já utilizado, com a data do uso',
      409,
      { message: 'Já utilizado', codigo: 'RESGATE_JA_UTILIZADO', dataUso: USADO_EM },
      `Este código já foi utilizado em ${formatarDataHora(USADO_EM)}.`,
    ],
    [
      'já utilizado, sem a data do uso',
      409,
      { message: 'Já utilizado', codigo: 'RESGATE_JA_UTILIZADO' },
      'Este código já foi utilizado.',
    ],
    [
      'expirado',
      409,
      { message: 'Expirado', codigo: 'RESGATE_EXPIRADO' },
      'Este código expirou e não pode mais ser usado.',
    ],
    [
      'com código desconhecido',
      409,
      { message: 'Outro conflito', codigo: 'OUTRO' },
      'Não foi possível validar o código. Tente de novo.',
    ],
    [
      'sem código, mesmo com mensagem parecida',
      404,
      { message: 'Código não encontrado' },
      'Não foi possível validar o código. Tente de novo.',
    ],
    ['do servidor', 500, {}, 'Não foi possível validar o código. Tente de novo.'],
  ])('erro %s mostra a mensagem pelo código', async (_, status, corpo, mensagem) => {
    responder({ status, corpo })
    const campo = renderizar()

    await userEvent.type(campo, 'abcd2345{Enter}')

    const alerta = within(await erro())
    expect(alerta.getByText('Código não validado')).toBeInTheDocument()
    expect(alerta.getByText(mensagem)).toBeInTheDocument()
    expect(alerta.getByText('ABCD2345')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('mostra que já foi utilizado na data e hora do uso', async () => {
    responder({
      status: 409,
      corpo: { message: 'x', codigo: 'RESGATE_JA_UTILIZADO', dataUso: USADO_EM },
    })
    const campo = renderizar()

    await userEvent.type(campo, 'ABCD2345{Enter}')

    expect(await erro()).toHaveTextContent('Este código já foi utilizado em 19/11/2026 às 14:05.')
  })

  it('mostra o erro genérico quando a rede falha', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    const campo = renderizar()

    await userEvent.type(campo, 'ABCD2345{Enter}')

    expect(await erro()).toHaveTextContent('Não foi possível validar o código. Tente de novo.')
  })

  it('não envia duas vezes no clique duplo e desabilita o botão enquanto valida', async () => {
    const resposta = pendente()
    const fetch = vi.spyOn(globalThis, 'fetch').mockReturnValue(resposta.promessa)
    const campo = renderizar()

    await userEvent.type(campo, 'ABCD2345')
    cliqueDuplo(screen.getByRole('button', { name: 'Validar' }))

    expect(escritas(fetch)).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Validando…' })).toBeDisabled()

    await act(async () => resposta.resolver(new Response(JSON.stringify(CUPOM))))

    expect(await resultado()).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Validar' })).toBeEnabled()
    expect(escritas(fetch)).toHaveLength(1)
  })

  it('depois do sucesso, limpa o campo e devolve o foco para o próximo código', async () => {
    responder({ corpo: CUPOM })
    const campo = renderizar()

    await userEvent.type(campo, 'ABCD2345')
    await userEvent.click(screen.getByRole('button', { name: 'Validar' }))

    expect(await resultado()).toBeInTheDocument()
    expect(campo).toHaveValue('')
    expect(campo).toHaveFocus()
  })

  it('depois do erro, limpa o campo e devolve o foco para o próximo código', async () => {
    responder({ status: 409, corpo: { codigo: 'RESGATE_EXPIRADO' } })
    const campo = renderizar()

    await userEvent.type(campo, 'ABCD2345')
    await userEvent.click(screen.getByRole('button', { name: 'Validar' }))

    expect(await erro()).toBeInTheDocument()
    expect(campo).toHaveValue('')
    expect(campo).toHaveFocus()
  })

  it('mantém o último resultado até o próximo envio, que mostra só o novo', async () => {
    const segunda = pendente()
    const fetch = responder({ corpo: CUPOM })
    fetch.mockReturnValueOnce(segunda.promessa)
    const campo = renderizar()

    await userEvent.type(campo, 'ABCD2345{Enter}')
    expect(await resultado()).toHaveTextContent('Cupom validado')

    // Digitar o próximo código não apaga o resultado anterior
    await userEvent.type(campo, 'PRMO7788')
    expect(screen.getByRole('status')).toHaveTextContent('Cupom validado')

    // Enviar tira o resultado anterior, para não ser confundido com o do código novo
    await userEvent.type(campo, '{Enter}')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    await act(async () =>
      segunda.resolver(
        new Response(JSON.stringify({ codigo: 'RESGATE_JA_UTILIZADO', dataUso: USADO_EM }), {
          status: 409,
        }),
      ),
    )
    expect(await erro()).toHaveTextContent('PRMO7788')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('o código lido enquanto o anterior valida fica no campo, sem envio duplo, para enviar em seguida', async () => {
    const resposta = pendente()
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockReturnValueOnce(resposta.promessa)
      .mockResolvedValueOnce(new Response(JSON.stringify(PROMOCAO)))
    const campo = renderizar()

    await userEvent.type(campo, 'ABCD2345{Enter}')
    expect(campo).toHaveValue('')
    // O Enter do leitor chega com a primeira validação ainda em voo
    await userEvent.type(campo, 'PRMO7788{Enter}')
    expect(escritas(fetch)).toHaveLength(1)

    await act(async () => resposta.resolver(new Response(JSON.stringify(CUPOM))))

    expect(await resultado()).toHaveTextContent('Cupom validado')
    // A resposta da primeira não apaga o código lido depois
    expect(campo).toHaveValue('PRMO7788')
    expect(campo).toHaveFocus()

    await userEvent.type(campo, '{Enter}')
    expect(await screen.findByText('Promoção validada')).toBeInTheDocument()
    expect(corpoEnviado(fetch, 1)).toEqual({ codigo: 'PRMO7788' })
  })
})
