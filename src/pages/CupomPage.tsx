import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Alerta } from '@/components/common/Alerta'
import { FormCupom, type Cupom } from '@/components/cupom/FormCupom'
import { PageHeader } from '@/components/sistema/PageHeader'
import { get } from '@/lib/api'

// Cadastro em /cupons/novo e edição em /cupons/:id
export function CupomPage() {
  const { id } = useParams()
  // O id vai no caminho da API: só número, para a URL não apontar outro endpoint (ex.: "..%2F")
  const idValido = id === undefined || /^\d+$/.test(id)
  const [cupom, setCupom] = useState<Cupom>()
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!id || !idValido) return
    get<Cupom>(`/empresas/cupons/${id}`)
      .then(setCupom)
      .catch(() => setErro(true))
  }, [id, idValido])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo={id ? 'Editar cupom' : 'Cadastrar cupom'}
        descricao={
          id
            ? 'Atualize o produto, o desconto, a validade ou os pontos. A situação (ativo ou inativo) continua a mesma.'
            : 'Escolha o produto e defina o desconto, a validade e os pontos para resgatar.'
        }
      />

      {(erro || !idValido) && (
        <Alerta mensagem="Não foi possível carregar o cupom. Recarregue a página para tentar de novo." />
      )}
      {id && idValido && !cupom && !erro && <p className="text-zinc-500">Carregando cupom…</p>}
      {(!id || cupom) && <FormCupom cupom={cupom} />}
    </div>
  )
}
