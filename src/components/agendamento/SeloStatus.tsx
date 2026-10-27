import { ROTULO_STATUS, type StatusAgendamento } from './statusAgendamento'

// Mesmas pílulas de SituacaoConta: âmbar aguarda uma ação do médico, esmeralda está concluído, zinc é neutro
const CLASSES: Record<StatusAgendamento, string> = {
  AGENDADO: 'bg-amber-50 text-amber-800 ring-amber-200',
  REALIZADO: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  NAO_COMPARECEU: 'bg-zinc-100 text-zinc-600 ring-zinc-300',
}

export interface SeloStatusProps {
  status: StatusAgendamento
}

export function SeloStatus({ status }: SeloStatusProps) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ${CLASSES[status]}`}
    >
      {ROTULO_STATUS[status]}
    </span>
  )
}
