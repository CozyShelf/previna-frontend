import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { Icone } from '@/components/common/Icone'
import type { Cupom } from '@/components/cupom/FormCupom'
import { Listagem } from '@/components/sistema/Listagem'
import { PageHeader } from '@/components/sistema/PageHeader'
import { put } from '@/lib/api'
import { formatarData } from '@/lib/datas'
import BUTTON_CLASSES from '@/types/ButtonClasses'

const COLUNAS = ['Cupom', 'Validade', 'Pontos', 'Situação']

export function CuponsPage() {
  // Confirmação deixada pelo formulário ao voltar para a lista
  const mensagem = (useLocation().state as { mensagem?: string } | null)?.mensagem

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Cupons"
        descricao="Ofereça cupons de desconto para um produto específico. Desative um cupom para tirá-lo do ar e ative de novo quando quiser."
        acoes={
          <Link to="/cupons/novo" className={BUTTON_CLASSES.primary}>
            <Icone nome="adicionar" />
            Cadastrar cupom
          </Link>
        }
      />

      {mensagem && (
        <p role="status" className="text-sm font-medium text-emerald-700">
          {mensagem}
        </p>
      )}
      <Listagem<Cupom>
        caminho="/empresas/cupons"
        filtros={[]}
        vazio={<p className="text-zinc-500">Nenhum cupom cadastrado ainda.</p>}
      >
        {(cupons) => <TabelaCupons cupons={cupons} />}
      </Listagem>
    </div>
  )
}

function TabelaCupons({ cupons }: { cupons: Cupom[] }) {
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
          {cupons.map((cupom) => (
            <LinhaCupom key={cupom.id} cupom={cupom} />
          ))}
        </tbody>
      </table>
    </section>
  )
}

// A situação muda só na linha, sem recarregar a lista
function LinhaCupom({ cupom }: { cupom: Cupom }) {
  const [ativo, setAtivo] = useState(cupom.ativo)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(false)
  const acao = ativo ? 'Desativar' : 'Ativar'

  async function alternar() {
    setEnviando(true)
    setErro(false)
    try {
      setAtivo((await put<Cupom>(`/empresas/cupons/${cupom.id}/ativo`, { ativo: !ativo })).ativo)
    } catch {
      setErro(true)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <tr>
      <td className="py-3 pr-4 pl-6 font-medium text-zinc-900">{cupom.descricao}</td>
      <td className="px-4 py-3 text-zinc-700 tabular-nums">{formatarData(cupom.dataValidade)}</td>
      <td className="px-4 py-3 text-zinc-700 tabular-nums">
        {cupom.pontosNecessarios.toLocaleString('pt-BR')}
      </td>
      <td className="px-4 py-3">
        {ativo ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
            Ativo
          </span>
        ) : (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200">
            Inativo
          </span>
        )}
      </td>
      <td className="py-3 pr-6 text-right">
        <button
          type="button"
          onClick={alternar}
          disabled={enviando}
          aria-label={`${acao} ${cupom.descricao}`}
          className="font-medium text-previna-600 hover:text-previna-700 disabled:opacity-60"
        >
          {acao}
        </button>
        {erro && (
          <p role="alert" className="text-xs text-red-700">
            Não foi possível alterar. Tente de novo.
          </p>
        )}
      </td>
    </tr>
  )
}
