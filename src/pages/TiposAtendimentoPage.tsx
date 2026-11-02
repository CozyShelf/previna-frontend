import { Link, useLocation } from 'react-router-dom'

import { Icone } from '@/components/common/Icone'
import type { FiltroListagem } from '@/components/sistema/Listagem'
import { Listagem } from '@/components/sistema/Listagem'
import { PageHeader } from '@/components/sistema/PageHeader'
import {
  CATEGORIAS,
  OPCOES_CATEGORIA,
  type TipoAtendimento,
} from '@/components/tipo-atendimento/categorias'
import BUTTON_CLASSES from '@/types/ButtonClasses'

const COLUNAS = ['Tipo', 'Categoria', 'Pontuação', 'Status']

const FILTRO_CATEGORIA: FiltroListagem = {
  nome: 'categoria',
  rotulo: 'Categoria',
  opcoes: [{ valor: '', rotulo: 'Exames e consultas' }, ...OPCOES_CATEGORIA],
}

export function TiposAtendimentoPage() {
  // Confirmação deixada pelo formulário ao voltar para a lista
  const mensagem = (useLocation().state as { mensagem?: string } | null)?.mensagem

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
        {(tipos) => <TabelaTipos tipos={tipos} />}
      </Listagem>
    </div>
  )
}

function TabelaTipos({ tipos }: { tipos: TipoAtendimento[] }) {
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
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    tipo.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {tipo.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="py-3 pr-6 text-right">
                <Link
                  to={`/tipos-atendimento/${tipo.id}`}
                  aria-label={`Editar ${tipo.nome}`}
                  className="font-medium text-previna-600 hover:text-previna-700"
                >
                  Editar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
