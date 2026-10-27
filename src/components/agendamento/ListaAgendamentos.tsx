import { formatarData } from '@/lib/datas'
import { SeloStatus } from './SeloStatus'
import { TITULO_GRUPO, type Agendamento, type StatusAgendamento } from './statusAgendamento'

// Ordem dos grupos na tela: o backend já devolve os pendentes primeiro, e aqui eles ficam no topo
const GRUPOS: StatusAgendamento[] = ['AGENDADO', 'REALIZADO', 'NAO_COMPARECEU']

export interface ListaAgendamentosProps {
  agendamentos: Agendamento[]
}

export function ListaAgendamentos({ agendamentos }: ListaAgendamentosProps) {
  return (
    <div className="flex flex-col gap-6">
      {GRUPOS.map((grupo) => {
        const doGrupo = agendamentos.filter((agendamento) => agendamento.status === grupo)
        // Grupo sem nenhum item não aparece: a tela mostra só o que existe
        if (doGrupo.length === 0) return null

        return (
          <section
            key={grupo}
            className="overflow-hidden rounded-lg border border-zinc-200 bg-white"
            aria-labelledby={`grupo-${grupo}`}
          >
            <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-6 py-3">
              <h2 id={`grupo-${grupo}`} className="font-semibold text-zinc-900">
                {TITULO_GRUPO[grupo]}
              </h2>
              <span className="text-sm text-zinc-500 tabular-nums">({doGrupo.length})</span>
            </div>
            <ul className="divide-y divide-zinc-100">
              {doGrupo.map((agendamento) => (
                <li key={agendamento.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900">{agendamento.tipo}</p>
                    {agendamento.observacao && (
                      <p className="text-xs text-zinc-500">{agendamento.observacao}</p>
                    )}
                  </div>
                  <p className="text-sm text-zinc-700 tabular-nums">
                    {formatarData(agendamento.dataPrevista)}
                  </p>
                  <SeloStatus status={agendamento.status} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
