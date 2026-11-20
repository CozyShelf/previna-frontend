import { Link } from 'react-router-dom'

import { CATEGORIAS } from '@/components/tipo-atendimento/categorias'
import {
  Atalhos,
  CardLista,
  type Atalho,
  EstadoPainel,
  GradeListas,
  LinhaLista,
  Selo,
} from './blocos'
import {
  dataOuNada,
  destino,
  lerLista,
  numero,
  type AgendamentoDoPainel,
  type PainelMedicoDados,
} from './dados'
import { usePainel } from './usePainel'

const ATALHOS: Atalho[] = [
  { para: '/gestantes/pre-cadastro', rotulo: 'Pré-cadastrar gestante', icone: 'adicionar' },
  // O agendamento é feito na página da gestante: a lista é onde se escolhe qual
  { para: '/gestantes', rotulo: 'Agendar exame ou consulta', icone: 'gestantes' },
]

// Painel do médico, abaixo da agenda do dia: o que está atrasado, o que vem nos próximos dias e quem está sem
// nada marcado. Cada item leva à página da gestante, onde se agenda e se registra o desfecho
export function PainelMedico() {
  const painel = usePainel<PainelMedicoDados>('/painel/medico')
  const acompanhadas = numero(painel.dados?.gestantesAcompanhadas)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Atalhos atalhos={ATALHOS} />
        {acompanhadas !== undefined && (
          <Link
            to="/gestantes"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <span className="text-lg font-semibold text-zinc-900 tabular-nums">{acompanhadas}</span>{' '}
            {acompanhadas === 1 ? 'gestante acompanhada' : 'gestantes acompanhadas'}
          </Link>
        )}
      </div>

      <EstadoPainel estado={painel}>
        {(dados) => (
          <>
            <CardLista
              titulo="Atrasados"
              lista={lerLista(dados.atrasados)}
              vazio="Nenhum exame ou consulta atrasado."
              chave={chaveAgendamento}
              maisPara="/gestantes"
              alerta
            >
              {(item) => <LinhaAgendamento item={item} />}
            </CardLista>

            <GradeListas>
              <CardLista
                titulo="Próximos 7 dias"
                lista={lerLista(dados.proximos7Dias)}
                vazio="Nada marcado para os próximos 7 dias."
                chave={chaveAgendamento}
                maisPara="/gestantes"
              >
                {(item) => <LinhaAgendamento item={item} />}
              </CardLista>

              <CardLista
                titulo="Gestantes sem nada agendado"
                lista={lerLista(dados.semAgendamentoPendente)}
                vazio="Todas as gestantes têm um exame ou consulta agendado."
                chave={(item, i) => item.gestanteId ?? `sem-id-${i}`}
                maisPara="/gestantes"
              >
                {(item) => (
                  <LinhaLista para={destino('/gestantes', item.gestanteId)}>
                    <span className="min-w-0 flex-1 font-medium text-zinc-900">
                      {item.gestanteNome}
                    </span>
                    <span className="text-sm text-zinc-500">Agendar</span>
                  </LinhaLista>
                )}
              </CardLista>
            </GradeListas>
          </>
        )}
      </EstadoPainel>
    </div>
  )
}

const chaveAgendamento = (item: AgendamentoDoPainel, i: number) =>
  item.agendamentoId ?? `sem-id-${i}`

function LinhaAgendamento({ item }: { item: AgendamentoDoPainel }) {
  const categoria = CATEGORIAS[item.categoria as keyof typeof CATEGORIAS]
  const data = dataOuNada(item.dataPrevista)

  return (
    <LinhaLista para={destino('/gestantes', item.gestanteId)}>
      <span className="min-w-0 flex-1 font-medium text-zinc-900">{item.gestanteNome}</span>
      <span className="text-sm text-zinc-700">{item.tipoNome}</span>
      {categoria && <Selo>{categoria}</Selo>}
      {data && <span className="text-sm text-zinc-500 tabular-nums">{data}</span>}
    </LinhaLista>
  )
}
