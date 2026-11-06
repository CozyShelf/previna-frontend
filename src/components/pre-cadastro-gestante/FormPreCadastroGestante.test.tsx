import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FormPreCadastroGestante } from './FormPreCadastroGestante'

function renderizar(onCadastrado = vi.fn()) {
  render(
    <MemoryRouter>
      <FormPreCadastroGestante onCadastrado={onCadastrado} />
    </MemoryRouter>,
  )
}

const dataLocal = (dias: number) => {
  const data = new Date()
  data.setDate(data.getDate() + dias)
  return data.toLocaleDateString('sv-SE')
}

interface Dados {
  nome: string
  cpf: string
  dataNascimento: string
  telefone: string
  email: string
  dum: string
}

const VALIDOS: Dados = {
  nome: 'Maria da Silva',
  cpf: '52998224725',
  dataNascimento: '1998-04-10',
  telefone: '11987654321',
  email: '',
  dum: dataLocal(-70),
}

async function preencherEEnviar(alterados: Partial<Dados> = {}) {
  const dados = { ...VALIDOS, ...alterados }
  const rotulos: Record<keyof Dados, string> = {
    nome: 'Nome completo',
    cpf: 'CPF',
    dataNascimento: 'Data de nascimento',
    telefone: 'Telefone',
    email: 'E-mail',
    dum: 'Data da última menstruação (DUM)',
  }
  for (const [campo, rotulo] of Object.entries(rotulos)) {
    const valor = dados[campo as keyof Dados]
    if (valor) await userEvent.type(screen.getByLabelText(rotulo), valor)
  }
  await userEvent.click(screen.getByRole('button', { name: /cadastrar gestante/i }))
}

function responder(status: number, corpo: unknown = {}) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify(corpo), { status }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('FormPreCadastroGestante', () => {
  it('avisa que o CPF é inválido assim que os 11 dígitos são digitados', async () => {
    renderizar()
    const cpf = screen.getByLabelText('CPF')

    await userEvent.type(cpf, '53341037839')

    expect(cpf).toHaveValue('533.410.378-39')
    expect(cpf).toHaveAccessibleDescription('CPF inválido. Confira os números digitados.')

    await userEvent.clear(cpf)
    await userEvent.type(cpf, '52998224725')

    expect(cpf).not.toHaveAttribute('aria-invalid')
  })

  it('mostra o erro de cada campo ao enviar vazio, sem chamar a API', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    renderizar()

    await userEvent.click(screen.getByRole('button', { name: /cadastrar gestante/i }))

    expect(screen.getByText('Informe o nome completo.')).toBeInTheDocument()
    expect(screen.getByText('Informe o CPF.')).toBeInTheDocument()
    expect(screen.getByText('Informe o telefone.')).toBeInTheDocument()
    expect(screen.queryByText(/e-mail válido/)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Nome completo')).toHaveFocus()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('envia CPF e telefone só com dígitos e entrega as credenciais temporárias', async () => {
    const credenciais = { login: '52998224725', senha: 'Tmp#1234' }
    const fetch = responder(201, credenciais)
    const onCadastrado = vi.fn()
    renderizar(onCadastrado)

    await preencherEEnviar({ email: 'maria@email.com' })

    await vi.waitFor(() => expect(onCadastrado).toHaveBeenCalledWith(credenciais))
    const [caminho, init] = fetch.mock.calls[0]!
    expect(caminho).toMatch(/\/gestantes\/pre-cadastro$/)
    expect(JSON.parse(String(init?.body))).toEqual({
      nome: 'Maria da Silva',
      cpf: '52998224725',
      dataNascimento: '1998-04-10',
      telefone: '11987654321',
      email: 'maria@email.com',
      dum: VALIDOS.dum,
    })
  })

  it('não envia o e-mail quando ele fica em branco', async () => {
    const fetch = responder(201, { login: 'x', senha: 'y' })
    renderizar()

    await preencherEEnviar()

    await vi.waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).not.toHaveProperty('email')
  })

  it.each<[string, Partial<Dados>, string]>([
    [
      'nascimento futuro',
      { dataNascimento: dataLocal(1) },
      'A data de nascimento deve ser anterior a hoje.',
    ],
    ['nascimento antes de 1900', { dataNascimento: '1899-12-31' }, 'Informe uma data válida.'],
    [
      'telefone sem DDD',
      { telefone: '98765432' },
      'Informe o DDD e o número, com 10 ou 11 dígitos.',
    ],
    ['e-mail inválido', { email: 'maria@' }, 'Informe um e-mail válido, como nome@exemplo.com.'],
    ['DUM futura', { dum: dataLocal(1) }, 'A DUM não pode ser uma data futura.'],
    ['DUM antes de 1900', { dum: '1899-01-01' }, 'Informe uma data válida.'],
  ])('recusa %s, sem chamar a API', async (_, alterados, mensagem) => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    renderizar()

    await preencherEEnviar(alterados)

    expect(screen.getByText(mensagem)).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('pede a data de nascimento e a DUM quando ficam vazias', async () => {
    renderizar()

    await preencherEEnviar({ dataNascimento: '', dum: '' })

    expect(screen.getByText('Informe a data de nascimento.')).toBeInTheDocument()
    expect(screen.getByText('Informe a data da última menstruação.')).toBeInTheDocument()
  })

  it.each([
    [409, 'Já existe um cadastro com este CPF ou e-mail.'],
    [400, 'O servidor não aceitou os dados. Confira os campos e tente novamente.'],
    [500, 'Não foi possível cadastrar a gestante. Tente novamente.'],
  ])('com resposta %i da API, avisa e mantém o formulário', async (status, mensagem) => {
    responder(status)
    const onCadastrado = vi.fn()
    renderizar(onCadastrado)

    await preencherEEnviar()

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagem)
    expect(onCadastrado).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Nome completo')).toHaveValue('Maria da Silva')
    expect(screen.getByRole('button', { name: /cadastrar gestante/i })).toBeEnabled()
  })
})
