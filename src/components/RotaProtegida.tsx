import { Navigate, Outlet, useOutletContext } from 'react-router-dom'

import { obterToken, perfilDoToken, primeiroAcessoDoToken } from '@/lib/auth'

export interface RotaProtegidaProps {
  // Perfis que podem abrir as rotas filhas; sem a lista, basta estar logado. Os demais voltam ao início
  perfis?: string[]
}

export function RotaProtegida({ perfis }: RotaProtegidaProps) {
  // Repassa o contexto do layout de cima (ex.: o perfil do SistemaLayout) para as páginas filhas
  const contexto = useOutletContext()
  const token = obterToken()
  if (!token) return <Navigate to="/login" replace />
  // Com a senha temporária só dá para concluir o primeiro acesso
  if (primeiroAcessoDoToken(token)) return <Navigate to="/primeiro-acesso" replace />
  if (perfis && !perfis.includes(perfilDoToken(token))) return <Navigate to="/" replace />
  return <Outlet context={contexto} />
}
