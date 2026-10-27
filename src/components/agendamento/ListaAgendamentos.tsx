import { formatarData } from '@/lib/datas'
import { Button } from '../common/Button'
import { SeloStatus } from './SeloStatus'
import { TITULO_GRUPO, type Agendamento, type StatusAgendamento } from './statusAgendamento'

// Ordem dos grupos na tela: o backend já devolve os pendentes primeiro, e aqui eles ficam no topo
const GRUPOS: StatusAgendamento[] = ['AGENDADO', 'REALIZADO', 'NAO_COMPARECEU']

export interface ListaAgendamentosProps {
  agendamentos: Agendamento[]
  onResolver: (id: number, status: Exclude<StatusAgendamento, 'AGENDADO'>) => void
  // Id do item com o PUT em voo: desabilita os dois botões da linha
  resolvendo?: number
}

export function ListaAgendamentos({
  agendamentos,
  onResolver,
  resolvendo,
}: ListaAgendamentosProps) {
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
                  {/* Só o pendente aceita desfecho: o que já foi resolvido não volta atrás por aqui */}
                  {agendamento.status === 'AGENDADO' && (
                    <div className="flex items-center gap-2">
                      <Button
                        label="Confirmar realização"
                        style="primary"
                        disabled={resolvendo === agendamento.id}
                        onClick={() => onResolver(agendamento.id, 'REALIZADO')}
                      />
                      <Button
                        label="Não compareceu"
                        style="secondary"
                        disabled={resolvendo === agendamento.id}
                        onClick={() => onResolver(agendamento.id, 'NAO_COMPARECEU')}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
