import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { Alerta } from '@/components/common/Alerta'
import { Icone } from '@/components/common/Icone'
import type { FiltroListagem } from '@/components/sistema/Listagem'
import { Listagem } from '@/components/sistema/Listagem'
import { PageHeader } from '@/components/sistema/PageHeader'
import {
  CATEGORIAS,
  OPCOES_CATEGORIA,
  type TipoAtendimento,
} from '@/components/tipo-atendimento/categorias'
import { del } from '@/lib/api'
import BUTTON_CLASSES from '@/types/ButtonClasses'

const COLUNAS = ['Tipo', 'Categoria', 'Pontuação']

const FILTRO_CATEGORIA: FiltroListagem = {
  nome: 'categoria',
  rotulo: 'Categoria',
  opcoes: [{ valor: '', rotulo: 'Exames e consultas' }, ...OPCOES_CATEGORIA],
}

export function TiposAtendimentoPage() {
  // Confirmação deixada pelo formulário ao voltar para a lista, ou pela exclusão feita aqui
  const [mensagem, setMensagem] = useState(
    (useLocation().state as { mensagem?: string } | null)?.mensagem,
  )
  const [erro, setErro] = useState<string>()
  const [excluindo, setExcluindo] = useState<number>()

  async function excluir(tipo: TipoAtendimento, recarregar: () => void) {
    if (
      !window.confirm(
        `Excluir o tipo ${tipo.nome}? Ele some da lista de escolha; os exames e consultas já marcados nele continuam no histórico da gestante.`,
      )
    )
      return

    setMensagem(undefined)
    setErro(undefined)
    setExcluindo(tipo.id)
    try {
      await del(`/tipos-atendimento/${tipo.id}`)
      setMensagem(`Tipo ${tipo.nome} excluído com sucesso.`)
      recarregar()
    } catch {
      setErro(`Não foi possível excluir o tipo ${tipo.nome}. Tente novamente.`)
    } finally {
      setExcluindo(undefined)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Tipos de atendimento"
        descricao="Os exames e consultas que você pode marcar para as gestantes, além dos que já vêm no sistema. Só você vê e usa os tipos cadastrados aqui."
        acoes={
          <Link to="/tipos-atendimento/novo" className={BUTTON_CLASSES.primary}>
            <Icone nome="adicionar" />
            Cadastrar tipo
          </Link>
        }
      />

      {mensagem && (
        <p role="status" className="text-sm font-medium text-emerald-700">
          {mensagem}
        </p>
      )}
      {erro && <Alerta mensagem={erro} />}
      <Listagem<TipoAtendimento>
        caminho="/tipos-atendimento/meus"
        descricaoBusca="Buscar pelo nome"
        filtros={[FILTRO_CATEGORIA]}
        vazio={
          <p className="text-zinc-500">
            Você ainda não cadastrou nenhum tipo. Os exames e consultas que já vêm no sistema
            continuam disponíveis no cadastro da gestante.
          </p>
        }
      >
        {(tipos, recarregar) => (
          <TabelaTipos
            tipos={tipos}
            excluindo={excluindo}
            onExcluir={(tipo) => excluir(tipo, recarregar)}
          />
        )}
      </Listagem>
    </div>
  )
}

interface TabelaTiposProps {
  tipos: TipoAtendimento[]
  // Id do tipo cuja exclusão está em andamento
  excluindo?: number
  onExcluir: (tipo: TipoAtendimento) => void
}

function TabelaTipos({ tipos, excluindo, onExcluir }: TabelaTiposProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <table className="w-full text-left">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
          <tr>
            {COLUNAS.map((coluna) => (
              <th key={coluna} scope="col" className="px-4 py-2.5 font-medium first:pl-6">
                {coluna}
              </th>
            ))}
            <th scope="col" className="pr-6">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {tipos.map((tipo) => (
            <tr key={tipo.id}>
              <td className="py-3 pr-4 pl-6 font-medium text-zinc-900">{tipo.nome}</td>
              <td className="px-4 py-3 text-zinc-700">{CATEGORIAS[tipo.categoria]}</td>
              <td className="px-4 py-3 text-zinc-700 tabular-nums">{tipo.pontosBase}</td>
              <td className="py-3 pr-6 text-right">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    to={`/tipos-atendimento/${tipo.id}`}
                    aria-label={`Editar ${tipo.nome}`}
                    className="font-medium text-previna-600 hover:text-previna-700"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    aria-label={`Excluir ${tipo.nome}`}
                    disabled={excluindo !== undefined}
                    onClick={() => onExcluir(tipo)}
                    className="font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {excluindo === tipo.id ? 'Excluindo…' : 'Excluir'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
