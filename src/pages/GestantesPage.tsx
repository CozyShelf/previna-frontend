import { Link } from 'react-router-dom'

import { Icone } from '@/components/common/Icone'
import { Avatar } from '@/components/sistema/Avatar'
import { ComoFunciona, type Passo } from '@/components/sistema/ComoFunciona'
import { Listagem, type FiltroListagem } from '@/components/sistema/Listagem'
import { PageHeader } from '@/components/sistema/PageHeader'
import { FILTRO_SITUACAO } from '@/components/sistema/filtros'
import { SituacaoConta } from '@/components/sistema/SituacaoConta'
import { usePerfil } from '@/hooks/usePerfil'
import { formatarData, idadeGestacional } from '@/lib/datas'
import { mascararCpf, mascararTelefone } from '@/lib/mascaras'
import BUTTON_CLASSES from '@/types/ButtonClasses'

interface Gestante {
  id: number
  nome: string
  cpf: string
  telefone: string
  dum: string
  dataProvavelParto: string
  primeiroAcessoPendente: boolean
  // Nome do médico responsável
  medico: string
}

const PASSOS: Passo[] = [
  {
    titulo: 'Informe os dados',
    texto: 'Nome, CPF, data de nascimento, telefone e data da última menstruação.',
  },
  {
    titulo: 'Receba o acesso temporário',
    texto: 'O login é o CPF da gestante e a senha é gerada pelo sistema.',
  },
  {
    titulo: 'Entregue à gestante',
    texto: 'No primeiro acesso pelo app, ela cria login e senha próprios e completa o cadastro.',
  },
]

// Só para o médico com permissão de ver todas as gestantes
const FILTRO_ACOMPANHAMENTO: FiltroListagem = {
  nome: 'somenteMinhas',
  rotulo: 'Acompanhamento',
  opcoes: [
    { valor: '', rotulo: 'Todas as gestantes' },
    { valor: 'true', rotulo: 'Só as que acompanho' },
  ],
}

const COLUNAS = ['Gestante', 'Telefone', 'Idade gestacional', 'Data provável do parto', 'Situação']

export function GestantesPage() {
  const verTodas = usePerfil()?.verTodasGestantes === true

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Gestantes"
        descricao={
          verTodas
            ? 'Por permissão do administrador, você vê as gestantes de todos os médicos.'
            : 'Cadastre as gestantes que você acompanha no pré-natal.'
        }
        acoes={
          <Link to="/gestantes/pre-cadastro" className={BUTTON_CLASSES.primary}>
            <Icone nome="adicionar" />
            Pré-cadastrar gestante
          </Link>
        }
      />

      <Listagem<Gestante>
        caminho="/gestantes"
        descricaoBusca="Buscar por nome ou CPF"
        filtros={verTodas ? [FILTRO_SITUACAO, FILTRO_ACOMPANHAMENTO] : [FILTRO_SITUACAO]}
        vazio={<ComoFunciona passos={PASSOS} />}
      >
        {(gestantes) => <TabelaGestantes gestantes={gestantes} comMedico={verTodas} />}
      </Listagem>
    </div>
  )
}

interface TabelaGestantesProps {
  gestantes: Gestante[]
  comMedico: boolean
}

function TabelaGestantes({ gestantes, comMedico }: TabelaGestantesProps) {
  const colunas = comMedico ? [...COLUNAS.slice(0, 1), 'Médico', ...COLUNAS.slice(1)] : COLUNAS

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <table className="w-full text-left">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
          <tr>
            {colunas.map((coluna) => (
              <th key={coluna} scope="col" className="px-4 py-2.5 font-medium first:pl-6">
                {coluna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {gestantes.map((gestante) => (
            <tr key={gestante.id}>
              <td className="py-3 pr-4 pl-6">
                <div className="flex items-center gap-3">
                  <Avatar nome={gestante.nome} />
                  <div>
                    <p className="font-medium text-zinc-900">{gestante.nome}</p>
                    <p className="text-xs text-zinc-500 tabular-nums">
                      CPF {mascararCpf(gestante.cpf)}
                    </p>
                  </div>
                </div>
              </td>
              {comMedico && <td className="px-4 py-3 text-zinc-700">{gestante.medico}</td>}
              <td className="px-4 py-3 text-zinc-700 tabular-nums">
                {mascararTelefone(gestante.telefone)}
              </td>
              <td className="px-4 py-3 text-zinc-700">{idadeGestacional(gestante.dum)}</td>
              <td className="px-4 py-3 text-zinc-700 tabular-nums">
                {formatarData(gestante.dataProvavelParto)}
              </td>
              <td className="px-4 py-3">
                <SituacaoConta primeiroAcessoPendente={gestante.primeiroAcessoPendente} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
