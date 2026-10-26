import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Alerta } from '@/components/common/Alerta'
import { FormProduto, type Produto } from '@/components/produto/FormProduto'
import { PageHeader } from '@/components/sistema/PageHeader'
import { get } from '@/lib/api'

// Cadastro em /produtos/novo e edição em /produtos/:id
export function ProdutoPage() {
  const { id } = useParams()
  // O id vai no caminho da API: só número, para a URL não apontar outro endpoint (ex.: "..%2F")
  const idValido = id === undefined || /^\d+$/.test(id)
  const [produto, setProduto] = useState<Produto>()
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!id || !idValido) return
    get<Produto>(`/empresas/produtos/${id}`)
      .then(setProduto)
      .catch(() => setErro(true))
  }, [id, idValido])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo={id ? 'Editar produto' : 'Cadastrar produto'}
        descricao={
          id
            ? 'Atualize os dados do produto. As promoções e os cupons dele passam a mostrar os dados novos.'
            : 'Informe os dados do produto. Depois, ele pode entrar nas promoções e nos cupons da empresa.'
        }
      />

      {(erro || !idValido) && (
        <Alerta mensagem="Não foi possível carregar o produto. Recarregue a página para tentar de novo." />
      )}
      {id && idValido && !produto && !erro && <p className="text-zinc-500">Carregando produto…</p>}
      {(!id || produto) && <FormProduto produto={produto} />}
    </div>
  )
}
