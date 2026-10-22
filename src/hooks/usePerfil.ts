import { useOutletContext } from 'react-router-dom'

import { mascararCnpj } from '@/lib/mascaras'

export interface Perfil {
  nome: string
  email?: string
  login: string
  crm?: string
  cnpj?: string
}

// Linha abaixo do nome: CRM do médico, CNPJ da empresa parceira ou o papel do administrador
export function identificacao(perfil: Perfil) {
  if (perfil.crm) return perfil.crm
  if (perfil.cnpj) return `CNPJ ${mascararCnpj(perfil.cnpj)}`
  return 'Administrador'
}

export function usePerfil() {
  return useOutletContext<Perfil | undefined>()
}
