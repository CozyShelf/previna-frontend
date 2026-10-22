import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Alerta } from '@/components/common/Alerta'
import { Icone } from '@/components/common/Icone'
import { Avatar } from '@/components/sistema/Avatar'
import { ComoFunciona, type Passo } from '@/components/sistema/ComoFunciona'
import { PageHeader } from '@/components/sistema/PageHeader'
import { SituacaoConta } from '@/components/sistema/SituacaoConta'
import { get } from '@/lib/api'
import { mascararCnpj, mascararTelefone } from '@/lib/mascaras'
import BUTTON_CLASSES from '@/types/ButtonClasses'

interface Empresa {
  id: number
  razaoSocial: string
  cnpj: string
  email: string
  telefone: string
  responsavel: string
  primeiroAcessoPendente: boolean
}

const PASSOS: Passo[] = [
  {
    titulo: 'Informe os dados',
    texto: 'Razão social, CNPJ, responsável, e-mail e telefone da empresa.',
  },
  {
    titulo: 'O acesso vai por e-mail',
    texto: 'O login é o CNPJ e a senha temporária é gerada pelo sistema e enviada à empresa.',
  },
  {
    titulo: 'A empresa conclui o cadastro',
    texto: 'No primeiro acesso ao portal, ela cria login e senha próprios e completa os dados.',
  },
]

const COLUNAS = ['Empresa', 'Responsável', 'Contato', 'Situação']

export function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>()
  const [erro, setErro] = useState(false)

  useEffect(() => {
    get<Empresa[]>('/empresas')
      .then(setEmpresas)
      .catch(() => setErro(true))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Empresas parceiras"
        descricao="Cadastre as empresas que oferecem produtos, promoções e cupons às gestantes."
        acoes={
          <Link to="/empresas/pre-cadastro" className={BUTTON_CLASSES.primary}>
            <Icone nome="adicionar" />
            Pré-cadastrar empresa
          </Link>
        }
      />

      {erro && (
        <Alerta mensagem="Não foi possível carregar as empresas. Recarregue a página para tentar de novo." />
      )}
      {!empresas && !erro && <p className="text-zinc-500">Carregando empresas…</p>}
      {empresas?.length === 0 && <ComoFunciona passos={PASSOS} />}
      {empresas && empresas.length > 0 && <TabelaEmpresas empresas={empresas} />}
    </div>
  )
}

function TabelaEmpresas({ empresas }: { empresas: Empresa[] }) {
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
          {empresas.map((empresa) => (
            <tr key={empresa.id}>
              <td className="py-3 pr-4 pl-6">
                <div className="flex items-center gap-3">
                  <Avatar nome={empresa.razaoSocial} />
                  <div>
                    <p className="font-medium text-zinc-900">{empresa.razaoSocial}</p>
                    <p className="text-xs text-zinc-500 tabular-nums">
                      CNPJ {mascararCnpj(empresa.cnpj)}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-700">{empresa.responsavel}</td>
              <td className="px-4 py-3">
                <p className="text-zinc-700">{empresa.email}</p>
                <p className="text-xs text-zinc-500 tabular-nums">
                  {mascararTelefone(empresa.telefone)}
                </p>
              </td>
              <td className="px-4 py-3">
                <SituacaoConta primeiroAcessoPendente={empresa.primeiroAcessoPendente} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
