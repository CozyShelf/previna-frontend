import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'

import { ListaAgendamentos } from '@/components/agendamento/ListaAgendamentos'
import type { Agendamento, StatusAgendamento } from '@/components/agendamento/statusAgendamento'
import { Alerta } from '@/components/common/Alerta'
import { Icone } from '@/components/common/Icone'
import { DadosGestante, type Gestante } from '@/components/gestante/DadosGestante'
import { PageHeader } from '@/components/sistema/PageHeader'
import { ApiError, get, put } from '@/lib/api'
import BUTTON_CLASSES from '@/types/ButtonClasses'

export function GestantePage() {
  const { id } = useParams()
  // Confirmação deixada pelo formulário de cadastro ao voltar para cá
  const cadastrado = (useLocation().state as { mensagem?: string } | null)?.mensagem
  // O id vai no caminho da API: só número, para a URL não apontar outro endpoint (ex.: "..%2F")
  const idValido = id !== undefined && /^\d+$/.test(id)
  const [gestante, setGestante] = useState<Gestante>()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>()
  const [erro, setErro] = useState(false)
  const [resolvendo, setResolvendo] = useState<number>()
  const [erroAcao, setErroAcao] = useState<string>()
  const [aviso, setAviso] = useState<string>()

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

  // Confirmar credita os pontos do tipo; não comparecer só registra o fato
  async function resolver(id: number, status: Exclude<StatusAgendamento, 'AGENDADO'>) {
    const confirmando = status === 'REALIZADO'
    setErroAcao(undefined)
    setAviso(undefined)
    setResolvendo(id)
    try {
      const caminho = `/agendamentos/${id}/${confirmando ? 'confirmar' : 'nao-compareceu'}`
      const resposta = confirmando
        ? await put<{ agendamento: Agendamento; pontosCreditados: number; saldoPontos: number }>(
            caminho,
            {},
          )
        : { agendamento: await put<Agendamento>(caminho, {}), pontosCreditados: 0, saldoPontos: 0 }

      setAgendamentos((atuais) =>
        atuais?.map((item) => (item.id === id ? resposta.agendamento : item)),
      )
      if (confirmando) {
        setGestante((atual) => atual && { ...atual, saldoPontos: resposta.saldoPontos })
        setAviso(`Presença confirmada e ${resposta.pontosCreditados} pontos creditados.`)
      } else {
        setAviso('Não comparecimento registrado.')
      }
    } catch (e) {
      setErroAcao(mensagemDeErro(e))
    } finally {
      setResolvendo(undefined)
    }
  }

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
      {erroAcao && <Alerta mensagem={erroAcao} />}
      {cadastrado && !aviso && (
        <p role="status" className="text-sm font-medium text-emerald-700">
          {cadastrado}
        </p>
      )}
      {aviso && (
        <p
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
        >
          {aviso}
        </p>
      )}
      {agendamentos && agendamentos.length > 0 && (
        <ListaAgendamentos
          agendamentos={agendamentos}
          onResolver={resolver}
          resolvendo={resolvendo}
        />
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

function mensagemDeErro(erro: unknown) {
  if (erro instanceof ApiError && erro.status === 409)
    return 'Este exame ou consulta já foi resolvido. Recarregue a página.'
  if (erro instanceof ApiError && erro.status === 404)
    return 'Exame ou consulta não encontrado. Recarregue a página.'
  return 'Não foi possível salvar. Verifique sua conexão e tente novamente.'
}
