import { useState } from 'react'

import {
  CredenciaisTemporarias,
  type Credenciais,
} from '@/components/pre-cadastro-gestante/CredenciaisTemporarias'
import { FormPreCadastroGestante } from '@/components/pre-cadastro-gestante/FormPreCadastroGestante'
import { PageHeader } from '@/components/sistema/PageHeader'

export function PreCadastroGestantePage() {
  const [credenciais, setCredenciais] = useState<Credenciais>()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Pré-cadastro da gestante"
        descricao="Informe os dados iniciais. A gestante completa o cadastro no primeiro acesso ao app."
      />

      {credenciais ? (
        <CredenciaisTemporarias
          credenciais={credenciais}
          onNovoCadastro={() => setCredenciais(undefined)}
        />
      ) : (
        <FormPreCadastroGestante onCadastrado={setCredenciais} />
      )}
    </div>
  )
}
