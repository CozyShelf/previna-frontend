import { FormAgendamento } from '@/components/agendamento/FormAgendamento'
import { PageHeader } from '@/components/sistema/PageHeader'

export function CadastroAgendamentoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Cadastrar exame ou consulta"
        descricao="Marque um exame ou uma consulta do pré-natal para a gestante. Ele entra como pendente até você confirmar a realização."
      />
      <FormAgendamento />
    </div>
  )
}
