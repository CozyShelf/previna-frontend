import { Link, useLocation } from 'react-router-dom'

import { Icone } from '@/components/common/Icone'
import { CATEGORIAS } from '@/components/produto/categorias'
import type { Promocao } from '@/components/promocao/FormPromocao'
import { Listagem } from '@/components/sistema/Listagem'
import { PageHeader } from '@/components/sistema/PageHeader'
import { formatarData } from '@/lib/datas'
import BUTTON_CLASSES from '@/types/ButtonClasses'

const COLUNAS = ['Promoção', 'Categoria', 'Desconto', 'Vigência']

const PERCENTUAL = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export function PromocoesPage() {
  // Confirmação deixada pelo formulário ao voltar para a lista
  const mensagem = (useLocation().state as { mensagem?: string } | null)?.mensagem

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Promoções"
        descricao="Crie promoções com desconto em todos os produtos de uma categoria, por um período."
        acoes={
          <Link to="/promocoes/novo" className={BUTTON_CLASSES.primary}>
            <Icone nome="adicionar" />
            Cadastrar promoção
          </Link>
        }
      />

      {mensagem && (
        <p role="status" className="text-sm font-medium text-emerald-700">
          {mensagem}
        </p>
      )}
      <Listagem<Promocao>
        caminho="/empresas/promocoes"
        descricaoBusca="Buscar pelo título"
        filtros={[]}
        vazio={<p className="text-zinc-500">Nenhuma promoção cadastrada ainda.</p>}
      >
        {(promocoes) => <TabelaPromocoes promocoes={promocoes} />}
      </Listagem>
    </div>
  )
}

function TabelaPromocoes({ promocoes }: { promocoes: Promocao[] }) {
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
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {promocoes.map((promocao) => (
            <tr key={promocao.id}>
              <td className="py-3 pr-4 pl-6">
                <p className="font-medium text-zinc-900">{promocao.titulo}</p>
                {promocao.descricao && (
                  <p className="text-xs text-zinc-500">{promocao.descricao}</p>
                )}
              </td>
              <td className="px-4 py-3 text-zinc-700">{CATEGORIAS[promocao.categoria]}</td>
              <td className="px-4 py-3 text-zinc-700 tabular-nums">
                {PERCENTUAL.format(promocao.desconto)}%
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-zinc-700 tabular-nums">
                {formatarData(promocao.dataInicio)} a {formatarData(promocao.dataFim)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
