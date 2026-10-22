import { Navigate, Outlet } from 'react-router-dom'

import { obterToken, primeiroAcessoDoToken } from '@/lib/auth'

export function RotaProtegida() {
  const token = obterToken()
  if (!token) return <Navigate to="/login" replace />
  // Com a senha temporária só dá para concluir o primeiro acesso
  return primeiroAcessoDoToken(token) ? <Navigate to="/primeiro-acesso" replace /> : <Outlet />
}
