import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Alerta } from '@/components/common/Alerta'
import { FormMedico, type Medico } from '@/components/medico/FormMedico'
import { PageHeader } from '@/components/sistema/PageHeader'
import { get } from '@/lib/api'

// Cadastro em /medicos/novo e edição em /medicos/:id
export function MedicoPage() {
  const { id } = useParams()
  const [medico, setMedico] = useState<Medico>()
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!id) return
    get<Medico>(`/medicos/${id}`)
      .then(setMedico)
      .catch(() => setErro(true))
  }, [id])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo={id ? 'Editar médico' : 'Cadastrar médico'}
        descricao={
          id
            ? 'Atualize os dados, o login ou a senha do médico.'
            : 'Informe os dados do médico e defina o login e a senha que ele vai usar no portal.'
        }
      />

      {erro && (
        <Alerta mensagem="Não foi possível carregar o médico. Recarregue a página para tentar de novo." />
      )}
      {id && !medico && !erro && <p className="text-zinc-500">Carregando médico…</p>}
      {(!id || medico) && <FormMedico medico={medico} />}
    </div>
  )
}
