import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FormMedico, type Medico } from './FormMedico'

function Lista() {
  return <p>{(useLocation().state as { mensagem: string }).mensagem}</p>
}

function renderizar(medico?: Medico) {
  render(
    <MemoryRouter initialEntries={['/form']}>
      <Routes>
        <Route path="/form" element={<FormMedico medico={medico} />} />
        <Route path="/medicos" element={<Lista />} />
      </Routes>
    </MemoryRouter>,
  )
}

function responder(status: number) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify({}), { status }))
}

const corpoEnviado = (fetch: ReturnType<typeof responder>) =>
  JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))

const medico: Medico = {
  id: 7,
  nome: 'Ana Souza',
  cpf: '52998224725',
  email: 'ana@clinica.com',
  crm: 'CRM-SP 123456',
  login: 'ana.souza',
  verTodasGestantes: false,
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('FormMedico', () => {
  it('no cadastro exige a senha, sem chamar a API', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    renderizar()

    await userEvent.click(screen.getByRole('button', { name: /cadastrar médico/i }))

    expect(screen.getByText('Informe o nome completo.')).toBeInTheDocument()
    expect(screen.getByText('Informe o login.')).toBeInTheDocument()
    expect(screen.getByText('Defina uma senha.')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('cadastra com o login e a senha definidos pelo administrador e volta para a lista', async () => {
    const fetch = responder(201)
    renderizar()

    await userEvent.type(screen.getByLabelText('Nome completo'), 'Ana Souza')
    await userEvent.type(screen.getByLabelText('CPF'), '52998224725')
    await userEvent.type(screen.getByLabelText('CRM'), 'CRM-SP 123456')
    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@clinica.com')
    await userEvent.type(screen.getByLabelText('Login'), 'ana.souza')
    await userEvent.type(screen.getByLabelText('Senha'), 'senhaForte1')
    await userEvent.type(screen.getByLabelText('Confirme a senha'), 'senhaForte1')
    await userEvent.click(screen.getByRole('button', { name: /cadastrar médico/i }))

    expect(fetch.mock.calls[0]?.[0]).toMatch(/\/medicos$/)
    expect(fetch.mock.calls[0]?.[1]?.method).toBe('POST')
    expect(corpoEnviado(fetch)).toEqual({
      nome: 'Ana Souza',
      cpf: '52998224725',
      crm: 'CRM-SP 123456',
      email: 'ana@clinica.com',
      login: 'ana.souza',
      senha: 'senhaForte1',
      verTodasGestantes: false,
    })
    expect(
      await screen.findByText('Ana Souza cadastrado. Repasse o login e a senha ao médico.'),
    ).toBeInTheDocument()
  })

  it('na edição com a senha em branco mantém a senha atual', async () => {
    const fetch = responder(200)
    renderizar(medico)

    expect(screen.getByLabelText('CPF')).toHaveValue('529.982.247-25')
    await userEvent.clear(screen.getByLabelText('Login'))
    await userEvent.type(screen.getByLabelText('Login'), 'ana.s')
    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }))

    expect(fetch.mock.calls[0]?.[0]).toMatch(/\/medicos\/7$/)
    expect(fetch.mock.calls[0]?.[1]?.method).toBe('PUT')
    expect(corpoEnviado(fetch)).not.toHaveProperty('senha')
    expect(corpoEnviado(fetch).login).toBe('ana.s')
  })

  it('dá ao médico a permissão de ver todas as gestantes', async () => {
    const fetch = responder(200)
    renderizar(medico)

    await userEvent.click(screen.getByRole('checkbox', { name: /ver todas as gestantes/i }))
    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }))

    expect(corpoEnviado(fetch).verTodasGestantes).toBe(true)
  })

  it('na edição troca a senha só com a confirmação igual', async () => {
    const fetch = responder(200)
    renderizar(medico)

    await userEvent.type(screen.getByLabelText('Nova senha'), 'novaSenha2')
    await userEvent.type(screen.getByLabelText('Confirme a nova senha'), 'outraSenha2')
    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }))
    expect(screen.getByText('As senhas não conferem.')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()

    await userEvent.clear(screen.getByLabelText('Confirme a nova senha'))
    await userEvent.type(screen.getByLabelText('Confirme a nova senha'), 'novaSenha2')
    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }))
    expect(corpoEnviado(fetch).senha).toBe('novaSenha2')
  })

  it('avisa quando CPF, CRM, e-mail ou login já estão em uso', async () => {
    responder(409)
    renderizar(medico)

    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }))

    expect(
      await screen.findByText('Já existe um cadastro com este CPF, CRM, e-mail ou login.'),
    ).toBeInTheDocument()
  })
})
