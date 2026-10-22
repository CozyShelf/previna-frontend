import { useState } from 'react'

import {
  EmpresaPreCadastrada,
  type EmpresaCadastrada,
} from '@/components/pre-cadastro-empresa/EmpresaPreCadastrada'
import { FormPreCadastroEmpresa } from '@/components/pre-cadastro-empresa/FormPreCadastroEmpresa'
import { PageHeader } from '@/components/sistema/PageHeader'

export function PreCadastroEmpresaPage() {
  const [empresa, setEmpresa] = useState<EmpresaCadastrada>()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Pré-cadastro da empresa parceira"
        descricao="Informe os dados iniciais. A empresa recebe o acesso por e-mail e completa o cadastro no primeiro acesso ao portal."
      />

      {empresa ? (
        <EmpresaPreCadastrada empresa={empresa} onNovoCadastro={() => setEmpresa(undefined)} />
      ) : (
        <FormPreCadastroEmpresa onCadastrado={setEmpresa} />
      )}
    </div>
  )
}
