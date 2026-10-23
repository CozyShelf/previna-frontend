import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FormPerfilEmpresa } from './FormPerfilEmpresa'

const EMPRESA = {
  email: 'contato@bemnascer.com',
  telefone: '1133334444',
  responsavel: 'Ana Souza',
  endereco: 'Rua das Flores, 100',
  segmento: 'Farmácia',
  logoUrl: '/empresas/1/logo?v=1',
}

function responder(...corpos: unknown[]) {
  const fetch = vi.spyOn(globalThis, 'fetch')
  for (const corpo of corpos) fetch.mockResolvedValueOnce(new Response(JSON.stringify(corpo)))
  return fetch
}

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:logo')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('FormPerfilEmpresa', () => {
  it('mostra os dados salvos, com o logo atual', async () => {
    responder(EMPRESA)
    render(<FormPerfilEmpresa onSalvo={vi.fn()} />)

    expect(await screen.findByLabelText('E-mail')).toHaveValue('contato@bemnascer.com')
    expect(screen.getByLabelText('Telefone')).toHaveValue('(11) 3333-4444')
    expect(screen.getByLabelText('Segmento')).toHaveValue('Farmácia')
    expect(screen.getByRole('img', { name: 'Pré-visualização' })).toHaveAttribute(
      'src',
      expect.stringMatching(/\/empresas\/1\/logo\?v=1$/),
    )
  })

  it('salva as alterações pedindo para remover o logo', async () => {
    const fetch = responder(EMPRESA, { ...EMPRESA, responsavel: 'Bia Lima', logoUrl: undefined })
    const onSalvo = vi.fn()
    render(<FormPerfilEmpresa onSalvo={onSalvo} />)

    const responsavel = await screen.findByLabelText('Responsável')
    await userEvent.clear(responsavel)
    await userEvent.type(responsavel, 'Bia Lima')
    await userEvent.click(screen.getByRole('button', { name: 'Remover' }))
    expect(screen.queryByRole('img', { name: 'Pré-visualização' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Alterações salvas.')).toBeInTheDocument()
    const [caminho, init] = fetch.mock.calls[1]!
    expect(caminho).toMatch(/\/empresas\/perfil$/)
    const corpo = init?.body as FormData
    expect(corpo.get('responsavel')).toBe('Bia Lima')
    expect(corpo.get('telefone')).toBe('1133334444')
    expect(corpo.get('removerLogo')).toBe('true')
    expect(onSalvo).toHaveBeenCalled()
  })

  it('não envia com campo obrigatório vazio', async () => {
    const fetch = responder(EMPRESA)
    render(<FormPerfilEmpresa onSalvo={vi.fn()} />)

    await userEvent.clear(await screen.findByLabelText('Endereço'))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(screen.getByText('Informe o endereço.')).toBeInTheDocument()
    expect(screen.getByLabelText('Endereço')).toHaveFocus()
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
