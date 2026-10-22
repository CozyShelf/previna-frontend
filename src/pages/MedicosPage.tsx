import { Link, useLocation } from 'react-router-dom'

import { Icone } from '@/components/common/Icone'
import type { Medico } from '@/components/medico/FormMedico'
import { Avatar } from '@/components/sistema/Avatar'
import { Listagem, type FiltroListagem } from '@/components/sistema/Listagem'
import { PageHeader } from '@/components/sistema/PageHeader'
import { mascararCpf } from '@/lib/mascaras'
import BUTTON_CLASSES from '@/types/ButtonClasses'

const FILTRO_ACESSO: FiltroListagem = {
  nome: 'verTodasGestantes',
  rotulo: 'Acesso às gestantes',
  opcoes: [
    { valor: '', rotulo: 'Todos os acessos' },
    { valor: 'true', rotulo: 'Vê todas as gestantes' },
    { valor: 'false', rotulo: 'Só as que acompanha' },
  ],
}

const COLUNAS = ['Médico', 'CRM', 'E-mail', 'Login', 'Gestantes']

export function MedicosPage() {
  // Confirmação deixada pelo formulário ao voltar para a lista
  const mensagem = (useLocation().state as { mensagem?: string } | null)?.mensagem

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Médicos"
        descricao="Cadastre os médicos e defina o login e a senha que eles usam no portal."
        acoes={
          <Link to="/medicos/novo" className={BUTTON_CLASSES.primary}>
            <Icone nome="adicionar" />
            Cadastrar médico
          </Link>
        }
      />

      {mensagem && (
        <p role="status" className="text-sm font-medium text-emerald-700">
          {mensagem}
        </p>
      )}
      <Listagem<Medico>
        caminho="/medicos"
        descricaoBusca="Buscar por nome, CPF, CRM, e-mail ou login"
        filtros={[FILTRO_ACESSO]}
        vazio={<p className="text-zinc-500">Nenhum médico cadastrado ainda.</p>}
      >
        {(medicos) => <TabelaMedicos medicos={medicos} />}
      </Listagem>
    </div>
  )
}

function TabelaMedicos({ medicos }: { medicos: Medico[] }) {
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
          {medicos.map((medico) => (
            <tr key={medico.id}>
              <td className="py-3 pr-4 pl-6">
                <div className="flex items-center gap-3">
                  <Avatar nome={medico.nome} />
                  <div>
                    <p className="font-medium text-zinc-900">{medico.nome}</p>
                    <p className="text-xs text-zinc-500 tabular-nums">
                      CPF {mascararCpf(medico.cpf)}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-700">{medico.crm}</td>
              <td className="px-4 py-3 text-zinc-700">{medico.email}</td>
              <td className="px-4 py-3 text-zinc-700">{medico.login}</td>
              <td className="px-4 py-3 text-zinc-700">
                {medico.verTodasGestantes ? 'Todas' : 'Só as que acompanha'}
              </td>
              <td className="py-3 pr-6 text-right">
                <Link
                  to={`/medicos/${medico.id}`}
                  aria-label={`Editar ${medico.nome}`}
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
