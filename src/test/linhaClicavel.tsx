import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

function Destino() {
  return <p>Aberto: {useLocation().pathname}</p>
}

interface ListagemComDestinoProps {
  caminho: string
  children: ReactNode
}

// Monta a listagem em `caminho` e, em `caminho/:id`, uma tela que mostra o endereço aberto, para os testes
// conferirem aonde a linha (ou o link de editar) levou
export function ListagemComDestino({ caminho, children }: ListagemComDestinoProps) {
  return (
    <MemoryRouter initialEntries={[caminho]}>
      <Routes>
        <Route path={caminho} element={children} />
        <Route path={`${caminho}/:id`} element={<Destino />} />
      </Routes>
    </MemoryRouter>
  )
}
