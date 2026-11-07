import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ContextoPerfil, Perfil } from '@/hooks/usePerfil'
import { entrarComo } from '@/test/sessao'
import { PerfilPage } from './PerfilPage'

// O perfil chega pelo contexto do SistemaLayout
function renderizar(perfil?: Perfil, recarregarPerfil = vi.fn()) {
  const { container } = render(
    <MemoryRouter initialEntries={['/perfil']}>
      <Routes>
        <Route element={<Outlet context={{ perfil, recarregarPerfil } satisfies ContextoPerfil} />}>
          <Route path="/perfil" element={<PerfilPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
  return container
}

const valorDe = (rotulo: string) => screen.getByText(rotulo).nextSibling

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('PerfilPage', () => {
  it('não mostra nada enquanto o perfil carrega', () => {
    entrarComo('MEDICO')

    expect(renderizar()).toBeEmptyDOMElement()
  })

  it('mostra os dados do médico, sem formulário de edição', () => {
    entrarComo('MEDICO')
    renderizar({ nome: 'Dra. Ana Lima', login: 'ana', email: 'ana@clinica.com', crm: 'CRM/SP 1' })

    expect(screen.getByText('Dados da sua conta no Previna.')).toBeInTheDocument()
    expect(screen.getByText('Dra. Ana Lima')).toBeInTheDocument()
    expect(screen.getByText('CRM/SP 1')).toBeInTheDocument()
    expect(valorDe('E-mail')).toHaveTextContent('ana@clinica.com')
    expect(valorDe('Login')).toHaveTextContent('ana')
    expect(screen.queryByRole('button', { name: 'Salvar alterações' })).not.toBeInTheDocument()
  })

  it('administrador sem e-mail aparece como "Não informado"', () => {
    entrarComo('ADMIN')
    renderizar({ nome: 'Admin Geral', login: 'admin' })

    expect(screen.getByText('Administrador')).toBeInTheDocument()
    expect(valorDe('E-mail')).toHaveTextContent('Não informado')
  })

  it('a empresa parceira edita os próprios dados e o menu é atualizado ao salvar', async () => {
    entrarComo('EMPRESA_PARCEIRA')
    const empresa = {
      email: 'contato@bemnascer.com',
      telefone: '1133334444',
      responsavel: 'Ana Souza',
      endereco: 'Rua das Flores, 100',
      segmento: 'Farmácia',
    }
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => new Response(JSON.stringify(empresa)),
    )
    const recarregarPerfil = vi.fn()
    renderizar(
      { nome: 'Farmácia Bem Nascer', login: 'bemnascer', cnpj: '11222333000181' },
      recarregarPerfil,
    )

    expect(screen.getByText(/mantenha o contato e os dados da empresa em dia/i)).toBeInTheDocument()
    expect(screen.getByText('CNPJ 11.222.333/0001-81')).toBeInTheDocument()
    // O e-mail fica no formulário, não na lista de dados fixos
    expect(screen.queryByText('Não informado')).not.toBeInTheDocument()

    await userEvent.click(await screen.findByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Alterações salvas.')).toBeInTheDocument()
    expect(recarregarPerfil).toHaveBeenCalled()
  })
})
