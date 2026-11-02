import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Alerta } from '@/components/common/Alerta'
import { PageHeader } from '@/components/sistema/PageHeader'
import type { TipoAtendimento } from '@/components/tipo-atendimento/categorias'
import { FormTipoAtendimento } from '@/components/tipo-atendimento/FormTipoAtendimento'
import { get } from '@/lib/api'

// Cadastro em /tipos-atendimento/novo e edição em /tipos-atendimento/:id
export function TipoAtendimentoPage() {
  const { id } = useParams()
  // O id vai no caminho da API: só número, para a URL não apontar outro endpoint (ex.: "..%2F")
  const idValido = id === undefined || /^\d+$/.test(id)
  const [tipo, setTipo] = useState<TipoAtendimento>()
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!id || !idValido) return
    get<TipoAtendimento>(`/tipos-atendimento/${id}`)
      .then(setTipo)
      .catch(() => setErro(true))
  }, [id, idValido])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo={id ? 'Editar tipo' : 'Cadastrar tipo'}
        descricao={
          id
            ? 'Atualize os dados do tipo. Os exames e consultas já marcados e ainda pendentes passam a valer a nova pontuação; os já confirmados mantêm os pontos creditados.'
            : 'Informe os dados do tipo. Depois, ele aparece na lista do cadastro de exame ou consulta da gestante.'
        }
      />

      {(erro || !idValido) && (
        <Alerta mensagem="Não foi possível carregar o tipo. Recarregue a página para tentar de novo." />
      )}
      {id && idValido && !tipo && !erro && <p className="text-zinc-500">Carregando tipo…</p>}
      {(!id || tipo) && <FormTipoAtendimento tipo={tipo} />}
    </div>
  )
}
