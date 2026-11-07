import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Alerta } from '@/components/common/Alerta'
import { FormPromocao, type Promocao } from '@/components/promocao/FormPromocao'
import { PageHeader } from '@/components/sistema/PageHeader'
import { get } from '@/lib/api'

// Cadastro em /promocoes/novo e edição em /promocoes/:id
export function PromocaoPage() {
  const { id } = useParams()
  // O id vai no caminho da API: só número, para a URL não apontar outro endpoint (ex.: "..%2F")
  const idValido = id === undefined || /^\d+$/.test(id)
  const [promocao, setPromocao] = useState<Promocao>()
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!id || !idValido) return
    get<Promocao>(`/empresas/promocoes/${id}`)
      .then(setPromocao)
      .catch(() => setErro(true))
  }, [id, idValido])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo={id ? 'Editar promoção' : 'Cadastrar promoção'}
        descricao={
          id
            ? 'Atualize os dados da promoção. Ela alcança todos os produtos da empresa na categoria escolhida.'
            : 'Escolha a categoria, o desconto e o período em que a promoção vale. Ela alcança todos os produtos da empresa nessa categoria.'
        }
      />

      {(erro || !idValido) && (
        <Alerta mensagem="Não foi possível carregar a promoção. Recarregue a página para tentar de novo." />
      )}
      {id && idValido && !promocao && !erro && (
        <p className="text-zinc-500">Carregando promoção…</p>
      )}
      {(!id || promocao) && <FormPromocao promocao={promocao} />}
    </div>
  )
}
