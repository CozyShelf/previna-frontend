import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RotaProtegida } from '@/components/RotaProtegida'
import { obterToken } from '@/lib/auth'
import { tokenDe } from '@/test/sessao'
import { FormLogin } from './FormLogin'

// Depois do login a navegação vai para "/", que passa pela RotaProtegida como no app
function renderizar() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<FormLogin />} />
        <Route element={<RotaProtegida />}>
          <Route path="/" element={<p>Painel</p>} />
        </Route>
        <Route path="/primeiro-acesso" element={<p>Primeiro acesso</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

function responder(status: number, corpo: unknown = {}) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify(corpo), { status }))
}

async function entrar(login = 'ana', senha = 'senha123') {
  await userEvent.type(screen.getByLabelText(/^login$/i), login)
  await userEvent.type(screen.getByLabelText(/^senha$/i), senha)
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('FormLogin', () => {
  it('envia login e senha para a API de autenticação', async () => {
    const fetch = responder(200, { token: tokenDe('MEDICO') })
    renderizar()

    await entrar('dra.ana', 'segredo99')

    expect(await screen.findByText('Painel')).toBeInTheDocument()
    const [caminho, init] = fetch.mock.calls[0]!
    expect(caminho).toMatch(/\/auth\/login$/)
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({ login: 'dra.ana', senha: 'segredo99' })
  })

  it.each(['MEDICO', 'ADMIN', 'EMPRESA_PARCEIRA'])(
    'guarda o token e leva o perfil %s ao sistema',
    async (perfil) => {
      const token = tokenDe(perfil)
      responder(200, { token })
      renderizar()

      await entrar()

      expect(await screen.findByText('Painel')).toBeInTheDocument()
      expect(obterToken()).toBe(token)
    },
  )

  it('leva quem entrou com a senha temporária ao primeiro acesso', async () => {
    responder(200, { token: tokenDe('EMPRESA_PARCEIRA', true) })
    renderizar()

    await entrar()

    expect(await screen.findByText('Primeiro acesso')).toBeInTheDocument()
  })

  it('recusa a gestante, que usa o aplicativo, sem guardar o token', async () => {
    responder(200, { token: tokenDe('GESTANTE') })
    renderizar()

    await entrar()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Gestantes acessam o Previna pelo aplicativo no celular.',
    )
    expect(obterToken()).toBeNull()
    expect(screen.queryByText('Painel')).not.toBeInTheDocument()
  })

  it('avisa quando o login ou a senha estão errados e continua na tela', async () => {
    responder(401)
    renderizar()

    await entrar('ana', 'errada')

    expect(await screen.findByRole('alert')).toHaveTextContent('Login ou senha inválidos.')
    expect(obterToken()).toBeNull()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled()
  })

  it('avisa sobre falha de conexão ou erro do servidor', async () => {
    responder(500)
    renderizar()

    await entrar()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível entrar. Verifique sua conexão e tente novamente.',
    )
  })

  it('desabilita o botão enquanto entra e limpa o erro anterior', async () => {
    let concluir!: (resposta: Response) => void
    const fetch = vi.spyOn(globalThis, 'fetch')
    fetch.mockResolvedValueOnce(new Response('{}', { status: 401 }))
    fetch.mockReturnValueOnce(new Promise((resolver) => (concluir = resolver)))
    renderizar()

    await entrar()
    expect(await screen.findByRole('alert')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByRole('button', { name: 'Entrando…' })).toBeDisabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    concluir(new Response(JSON.stringify({ token: tokenDe('ADMIN') })))
    expect(await screen.findByText('Painel')).toBeInTheDocument()
  })
})
