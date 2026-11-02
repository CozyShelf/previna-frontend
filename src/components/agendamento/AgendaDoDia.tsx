import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Alerta } from '@/components/common/Alerta'
import { get } from '@/lib/api'
import { CATEGORIAS, type CategoriaAtendimento } from '../tipo-atendimento/categorias'

export interface AtendimentoDoDia {
  id: number
  gestante: number
  nomeGestante: string
  tipo: string
  categoria: CategoriaAtendimento
}

// Agenda de hoje do médico. Sem horário: agendamento só guarda a data, e o backend devolve na ordem de cadastro.
export function AgendaDoDia() {
  const [atendimentos, setAtendimentos] = useState<AtendimentoDoDia[]>()
  const [erro, setErro] = useState(false)

  useEffect(() => {
    get<AtendimentoDoDia[]>('/agendamentos/hoje')
      .then(setAtendimentos)
      .catch(() => setErro(true))
  }, [])

  return (
    <section
      aria-labelledby="agenda-do-dia"
      className="overflow-hidden rounded-lg border border-zinc-200 bg-white"
    >
      <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-6 py-3">
        <h2 id="agenda-do-dia" className="font-semibold text-zinc-900">
          Exames e consultas de hoje
        </h2>
        {atendimentos && atendimentos.length > 0 && (
          <span className="text-sm text-zinc-500 tabular-nums">({atendimentos.length})</span>
        )}
      </div>

      {erro && (
        <div className="px-6 py-5">
          <Alerta mensagem="Não foi possível carregar a agenda de hoje. Recarregue a página para tentar de novo." />
        </div>
      )}
      {!atendimentos && !erro && <p className="px-6 py-5 text-zinc-500">Carregando agenda…</p>}
      {atendimentos?.length === 0 && (
        <p className="px-6 py-5 text-zinc-600">
          Nada marcado para hoje. Os exames e consultas de outros dias ficam na página de cada
          gestante.
        </p>
      )}

      {atendimentos && atendimentos.length > 0 && (
        <ul className="divide-y divide-zinc-100">
          {atendimentos.map((atendimento) => (
            <li key={atendimento.id}>
              <Link
                to={`/gestantes/${atendimento.gestante}`}
                className="flex items-center gap-4 px-6 py-3 hover:bg-zinc-50"
              >
                <span className="min-w-0 flex-1 font-medium text-zinc-900">
                  {atendimento.nomeGestante}
                </span>
                <span className="text-sm text-zinc-700">{atendimento.tipo}</span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                  {CATEGORIAS[atendimento.categoria]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
