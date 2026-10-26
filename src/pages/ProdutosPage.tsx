import { Link, useLocation } from 'react-router-dom'

import { Icone } from '@/components/common/Icone'
import { CATEGORIAS, OPCOES_CATEGORIA } from '@/components/produto/categorias'
import type { Produto } from '@/components/produto/FormProduto'
import type { FiltroListagem } from '@/components/sistema/Listagem'
import { Avatar } from '@/components/sistema/Avatar'
import { Listagem } from '@/components/sistema/Listagem'
import { PageHeader } from '@/components/sistema/PageHeader'
import { urlDaApi } from '@/lib/api'
import { formatarPreco } from '@/lib/mascaras'
import BUTTON_CLASSES from '@/types/ButtonClasses'

const COLUNAS = ['Produto', 'Categoria', 'Preço sem desconto']

const FILTRO_CATEGORIA: FiltroListagem = {
  nome: 'categoria',
  rotulo: 'Categoria',
  opcoes: [{ valor: '', rotulo: 'Todas as categorias' }, ...OPCOES_CATEGORIA],
}

export function ProdutosPage() {
  // Confirmação deixada pelo formulário ao voltar para a lista
  const mensagem = (useLocation().state as { mensagem?: string } | null)?.mensagem

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Produtos"
        descricao="Cadastre os produtos da empresa para usá-los nas promoções e nos cupons."
        acoes={
          <Link to="/produtos/novo" className={BUTTON_CLASSES.primary}>
            <Icone nome="adicionar" />
            Cadastrar produto
          </Link>
        }
      />

      {mensagem && (
        <p role="status" className="text-sm font-medium text-emerald-700">
          {mensagem}
        </p>
      )}
      <Listagem<Produto>
        caminho="/empresas/produtos"
        descricaoBusca="Buscar pelo nome"
        filtros={[FILTRO_CATEGORIA]}
        vazio={<p className="text-zinc-500">Nenhum produto cadastrado ainda.</p>}
      >
        {(produtos) => <TabelaProdutos produtos={produtos} />}
      </Listagem>
    </div>
  )
}

function TabelaProdutos({ produtos }: { produtos: Produto[] }) {
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
          {produtos.map((produto) => (
            <tr key={produto.id}>
              <td className="py-3 pr-4 pl-6">
                <div className="flex items-center gap-3">
                  <Avatar
                    nome={produto.nome}
                    imagem={produto.imagemUrl && urlDaApi(produto.imagemUrl)}
                  />
                  <div>
                    <p className="font-medium text-zinc-900">{produto.nome}</p>
                    {produto.descricao && (
                      <p className="text-xs text-zinc-500">{produto.descricao}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-700">
                {produto.categoria ? CATEGORIAS[produto.categoria] : '—'}
              </td>
              <td className="px-4 py-3 text-zinc-700 tabular-nums">
                {produto.preco === undefined ? '—' : formatarPreco(produto.preco)}
              </td>
              <td className="py-3 pr-6 text-right">
                <Link
                  to={`/produtos/${produto.id}`}
                  aria-label={`Editar ${produto.nome}`}
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
