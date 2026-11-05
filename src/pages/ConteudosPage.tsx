import { Link, useLocation } from 'react-router-dom'

import { Icone } from '@/components/common/Icone'
import {
  CATEGORIAS,
  OPCOES_CATEGORIA,
  OPCOES_TIPO,
  TIPOS,
  type Conteudo,
} from '@/components/conteudo/tipos'
import { Listagem, type FiltroListagem } from '@/components/sistema/Listagem'
import { PageHeader } from '@/components/sistema/PageHeader'
import BUTTON_CLASSES from '@/types/ButtonClasses'

const COLUNAS = ['Conteúdo', 'Categoria', 'Tipo', 'Situação']

const FILTROS: FiltroListagem[] = [
  {
    nome: 'categoria',
    rotulo: 'Categoria',
    opcoes: [{ valor: '', rotulo: 'Todas as categorias' }, ...OPCOES_CATEGORIA],
  },
  {
    nome: 'tipo',
    rotulo: 'Tipo',
    opcoes: [{ valor: '', rotulo: 'Todos os tipos' }, ...OPCOES_TIPO],
  },
  {
    nome: 'publicado',
    rotulo: 'Situação',
    opcoes: [
      { valor: '', rotulo: 'Todas as situações' },
      { valor: 'true', rotulo: 'Publicado' },
      { valor: 'false', rotulo: 'Rascunho' },
    ],
  },
]

export function ConteudosPage() {
  // Confirmação deixada pelo formulário ao voltar para a lista
  const mensagem = (useLocation().state as { mensagem?: string } | null)?.mensagem

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Conteúdo educativo"
        descricao="Cadastre dicas, notícias e avisos sobre o pré-natal. Só os publicados aparecem no aplicativo das gestantes."
        acoes={
          <Link to="/conteudos/novo" className={BUTTON_CLASSES.primary}>
            <Icone nome="adicionar" />
            Cadastrar conteúdo
          </Link>
        }
      />

      {mensagem && (
        <p role="status" className="text-sm font-medium text-emerald-700">
          {mensagem}
        </p>
      )}
      <Listagem<Conteudo>
        caminho="/conteudos"
        descricaoBusca="Buscar pelo título"
        filtros={FILTROS}
        vazio={<p className="text-zinc-500">Nenhum conteúdo cadastrado ainda.</p>}
      >
        {(conteudos) => <TabelaConteudos conteudos={conteudos} />}
      </Listagem>
    </div>
  )
}

// Mesmas pílulas do SeloStatus: esmeralda está no ar, zinc é neutro
const CLASSES_SITUACAO = {
  true: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  false: 'bg-zinc-100 text-zinc-600 ring-zinc-300',
}

function TabelaConteudos({ conteudos }: { conteudos: Conteudo[] }) {
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
          {conteudos.map((conteudo) => (
            <tr key={conteudo.id}>
              <td className="py-3 pr-4 pl-6">
                <p className="font-medium text-zinc-900">{conteudo.titulo}</p>
                {conteudo.resumo && <p className="text-xs text-zinc-500">{conteudo.resumo}</p>}
              </td>
              <td className="px-4 py-3 text-zinc-700">{CATEGORIAS[conteudo.categoria]}</td>
              <td className="px-4 py-3 text-zinc-700">{TIPOS[conteudo.tipo]}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ${CLASSES_SITUACAO[`${conteudo.publicado}`]}`}
                >
                  {conteudo.publicado ? 'Publicado' : 'Rascunho'}
                </span>
              </td>
              <td className="py-3 pr-6 text-right">
                <Link
                  to={`/conteudos/${conteudo.id}`}
                  aria-label={`Editar ${conteudo.titulo}`}
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
