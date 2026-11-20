import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LinhaClicavel } from '@/components/sistema/LinhaClicavel'

const aoAgir = vi.fn()

function renderizar() {
  render(
    <MemoryRouter>
      <Routes>
        <Route
          path="/"
          element={
            <table>
              <tbody>
                <LinhaClicavel para="/itens/1">
                  <td>
                    <Link to="/outro">Item 1</Link>
                  </td>
                  <td>Detalhe</td>
                  <td>
                    <button type="button" onClick={aoAgir}>
                      <span>Excluir</span>
                    </button>
                  </td>
                </LinhaClicavel>
              </tbody>
            </table>
          }
        />
        <Route path="/itens/1" element={<p>Página do item</p>} />
        <Route path="/outro" element={<p>Destino do link</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  aoAgir.mockClear()
  window.getSelection()?.removeAllRanges()
})

describe('LinhaClicavel', () => {
  it('leva ao destino quando se clica numa célula', async () => {
    renderizar()

    await userEvent.click(screen.getByText('Detalhe'))

    expect(screen.getByText('Página do item')).toBeInTheDocument()
  })

  it('não toma o lugar do link de dentro da linha', async () => {
    renderizar()

    await userEvent.click(screen.getByRole('link', { name: 'Item 1' }))

    // Vale o destino do link, e a linha não navega por cima dele
    expect(screen.getByText('Destino do link')).toBeInTheDocument()
  })

  it('não navega quando o clique é num botão da linha, nem num elemento dentro dele', async () => {
    renderizar()

    await userEvent.click(screen.getByText('Excluir'))

    expect(aoAgir).toHaveBeenCalledOnce()
    expect(screen.getByText('Detalhe')).toBeInTheDocument()
    expect(screen.queryByText('Página do item')).not.toBeInTheDocument()
  })

  it.each(['Control', 'Meta', 'Shift', 'Alt'])(
    'deixa o clique com %s para o navegador',
    async (tecla) => {
      renderizar()
      const usuario = userEvent.setup()

      await usuario.keyboard(`{${tecla}>}`)
      await usuario.click(screen.getByText('Detalhe'))

      expect(screen.queryByText('Página do item')).not.toBeInTheDocument()
    },
  )

  it('ignora o botão do meio do mouse', () => {
    renderizar()

    // O navegador não costuma disparar click no botão do meio, mas a linha não depende disso
    fireEvent.click(screen.getByText('Detalhe'), { button: 1 })

    expect(screen.queryByText('Página do item')).not.toBeInTheDocument()
  })

  it('não navega quando o clique termina uma seleção de texto', () => {
    renderizar()
    const celula = screen.getByText('Detalhe')
    window.getSelection()?.selectAllChildren(celula)

    // fireEvent, porque o userEvent desfaz a seleção ao apertar o botão
    fireEvent.click(celula)

    expect(screen.queryByText('Página do item')).not.toBeInTheDocument()
  })
})
