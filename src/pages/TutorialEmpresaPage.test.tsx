import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { TutorialEmpresaPage } from '@/pages/TutorialEmpresaPage'

describe('TutorialEmpresaPage', () => {
  it('passa por produtos, promoções, cupons e validação até o painel', async () => {
    render(
      <MemoryRouter initialEntries={['/tutorial']}>
        <Routes>
          <Route path="/tutorial" element={<TutorialEmpresaPage />} />
          <Route path="/" element={<p>Painel da empresa</p>} />
        </Routes>
      </MemoryRouter>,
    )
    const proximo = () => userEvent.click(screen.getByRole('button', { name: 'Próximo' }))

    expect(screen.getByRole('heading', { name: 'Cadastre seus produtos' })).toBeInTheDocument()
    await proximo()
    expect(screen.getByRole('heading', { name: 'Crie promoções' })).toBeInTheDocument()
    await proximo()
    expect(screen.getByRole('heading', { name: 'Ofereça cupons' })).toBeInTheDocument()
    await proximo()
    expect(screen.getByText('Etapa 4 de 4')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Ir para o painel' }))

    expect(screen.getByText('Painel da empresa')).toBeInTheDocument()
  })
})
