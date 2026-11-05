import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Alerta } from '@/components/common/Alerta'
import { FormConteudo } from '@/components/conteudo/FormConteudo'
import type { Conteudo } from '@/components/conteudo/tipos'
import { PageHeader } from '@/components/sistema/PageHeader'
import { get } from '@/lib/api'

// Cadastro em /conteudos/novo e edição em /conteudos/:id
export function ConteudoPage() {
  const { id } = useParams()
  // O id vai no caminho da API: só número, para a URL não apontar outro endpoint (ex.: "..%2F")
  const idValido = id === undefined || /^\d+$/.test(id)
  const [conteudo, setConteudo] = useState<Conteudo>()
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!id || !idValido) return
    get<Conteudo>(`/conteudos/${id}`)
      .then(setConteudo)
      .catch(() => setErro(true))
  }, [id, idValido])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo={id ? 'Editar conteúdo' : 'Cadastrar conteúdo'}
        descricao={
          id
            ? 'Atualize o conteúdo. Enquanto ele estiver publicado, as alterações aparecem no app na próxima vez que a gestante abrir a tela inicial.'
            : 'O conteúdo é salvo como rascunho. Ele só aparece para as gestantes depois que você publicar.'
        }
      />

      {(erro || !idValido) && (
        <Alerta mensagem="Não foi possível carregar o conteúdo. Recarregue a página para tentar de novo." />
      )}
      {id && idValido && !conteudo && !erro && (
        <p className="text-zinc-500">Carregando conteúdo…</p>
      )}
      {(!id || conteudo) && <FormConteudo conteudo={conteudo} />}
    </div>
  )
}
