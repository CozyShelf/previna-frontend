import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { NotFoundPage } from '@/pages/NotFoundPage'
import { AppLayout } from './AppLayout'

describe('AppLayout', () => {
  it('envolve a página com o cabeçalho e o rodapé do Previna', () => {
    render(
      <MemoryRouter initialEntries={['/qualquer-coisa']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      'Previna — acompanhamento de pré-natal',
    )
    expect(screen.getByRole('main')).toHaveTextContent('Página não encontrada')
  })
})
