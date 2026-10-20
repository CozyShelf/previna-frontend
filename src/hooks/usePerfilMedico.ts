import { useOutletContext } from 'react-router-dom'

export interface PerfilMedico {
  nome: string
  email?: string
  login: string
  crm: string
}

export function usePerfilMedico() {
  return useOutletContext<PerfilMedico | undefined>()
}
