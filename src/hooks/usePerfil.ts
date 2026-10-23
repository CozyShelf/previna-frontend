import { useOutletContext } from 'react-router-dom'

import { urlDaApi } from '@/lib/api'
import { mascararCnpj } from '@/lib/mascaras'

export interface Perfil {
  nome: string
  email?: string
  login: string
  crm?: string
  cnpj?: string
  logoUrl?: string
  // Permissão dada pelo administrador ao médico
  verTodasGestantes?: boolean
}

// Logo da empresa parceira para o avatar; os demais perfis ficam com as iniciais
export const imagemDoPerfil = (perfil?: Perfil) =>
  perfil?.logoUrl ? urlDaApi(perfil.logoUrl) : undefined

// Linha abaixo do nome: CRM do médico, CNPJ da empresa parceira ou o papel do administrador
export function identificacao(perfil: Perfil) {
  if (perfil.crm) return perfil.crm
  if (perfil.cnpj) return `CNPJ ${mascararCnpj(perfil.cnpj)}`
  return 'Administrador'
}

export interface ContextoPerfil {
  perfil?: Perfil
  // Busca o perfil de novo, ex.: para o menu mostrar o logo recém-trocado
  recarregarPerfil: () => void
}

export function usePerfil() {
  return useOutletContext<ContextoPerfil>().perfil
}

export function useRecarregarPerfil() {
  return useOutletContext<ContextoPerfil>().recarregarPerfil
}
