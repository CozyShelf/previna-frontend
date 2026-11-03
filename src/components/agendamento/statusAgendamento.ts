// Mesmos valores do enum StatusAgendamento no backend; a ordem é a de exibição, pendentes primeiro
export const ROTULO_STATUS = {
  AGENDADO: 'Pendente',
  REALIZADO: 'Realizado',
  NAO_COMPARECEU: 'Não compareceu',
} as const

export type StatusAgendamento = keyof typeof ROTULO_STATUS

// Título do grupo na lista, no plural
export const TITULO_GRUPO: Record<StatusAgendamento, string> = {
  AGENDADO: 'Pendentes',
  REALIZADO: 'Realizados',
  NAO_COMPARECEU: 'Não compareceram',
}

export interface Agendamento {
  id: number
  tipo: string
  categoria: 'EXAME' | 'CONSULTA'
  pontosBase: number
  dataPrevista: string
  status: StatusAgendamento
  dataConfirmacao?: string
  observacao?: string
}
