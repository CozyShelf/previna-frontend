import { Navigate } from 'react-router-dom'

import { FormPrimeiroAcessoEmpresa } from '@/components/primeiro-acesso-empresa/FormPrimeiroAcessoEmpresa'
import { PageHeader } from '@/components/sistema/PageHeader'
import { obterToken, primeiroAcessoDoToken } from '@/lib/auth'

export function PrimeiroAcessoEmpresaPage() {
  const token = obterToken()
  if (!token) return <Navigate to="/login" replace />
  if (!primeiroAcessoDoToken(token)) return <Navigate to="/" replace />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Finalize o cadastro da sua empresa"
        descricao="Crie seu acesso definitivo e complete os dados da empresa para começar a usar o Previna."
      />
      <FormPrimeiroAcessoEmpresa />
    </div>
  )
}
