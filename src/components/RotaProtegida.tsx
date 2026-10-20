import { Navigate, Outlet } from 'react-router-dom'

import { obterToken } from '@/lib/auth'

export function RotaProtegida() {
  return obterToken() ? <Outlet /> : <Navigate to="/login" replace />
}
