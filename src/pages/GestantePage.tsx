import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ListaAgendamentos } from '@/components/agendamento/ListaAgendamentos'
import type { Agendamento } from '@/components/agendamento/statusAgendamento'
import { Alerta } from '@/components/common/Alerta'
import { Icone } from '@/components/common/Icone'
import { DadosGestante, type Gestante } from '@/components/gestante/DadosGestante'
import { PageHeader } from '@/components/sistema/PageHeader'
import { get } from '@/lib/api'
import BUTTON_CLASSES from '@/types/ButtonClasses'

export function GestantePage() {
  const { id } = useParams()
  // O id vai no caminho da API: só número, para a URL não apontar outro endpoint (ex.: "..%2F")
  const idValido = id !== undefined && /^\d+$/.test(id)
  const [gestante, setGestante] = useState<Gestante>()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>()
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!idValido) return
    let vigente = true
    Promise.all([get<Gestante>(`/gestantes/${id}`), get<Agendamento[]>(`/gestantes/${id}/agendamentos`)])
      .then(([dados, lista]) => {
        if (!vigente) return
        setGestante(dados)
        setAgendamentos(lista)
      })
      .catch(() => vigente && setErro(true))
    return () => {
      vigente = false
    }
  }, [id, idValido])

  const cadastrar = (
    <Link to={`/gestantes/${id}/agendamentos/novo`} className={BUTTON_CLASSES.primary}>
      <Icone nome="adicionar" />
      Cadastrar exame ou consulta
    </Link>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo={gestante?.nome ?? 'Gestante'}
        descricao="Exames e consultas do pré-natal. Os pendentes aparecem primeiro, para você confirmar a realização ou registrar o não comparecimento."
        acoes={gestante && cadastrar}
      />

      {(erro || !idValido) && (
        <Alerta mensagem="Não foi possível carregar a gestante. Recarregue a página para tentar de novo." />
      )}
      {idValido && !gestante && !erro && <p className="text-zinc-500">Carregando gestante…</p>}

      {gestante && <DadosGestante gestante={gestante} />}
      {agendamentos && agendamentos.length > 0 && (
        <ListaAgendamentos agendamentos={agendamentos} />
      )}
      {agendamentos && agendamentos.length === 0 && (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <p className="text-zinc-600">
            Nenhum exame ou consulta cadastrado para esta gestante ainda.
          </p>
          {cadastrar}
        </div>
      )}
    </div>
  )
}
