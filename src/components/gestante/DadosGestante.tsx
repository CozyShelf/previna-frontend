import { formatarData, idadeGestacional } from '@/lib/datas'
import { mascararCpf, mascararTelefone } from '@/lib/mascaras'
import { SituacaoConta } from '@/components/sistema/SituacaoConta'

export interface Gestante {
  id: number
  nome: string
  cpf: string
  telefone: string
  email?: string
  dataNascimento: string
  dum: string
  dataProvavelParto: string
  saldoPontos: number
  primeiroAcessoPendente: boolean
  // Nome do médico responsável
  medico: string
}

export interface DadosGestanteProps {
  gestante: Gestante
}

export function DadosGestante({ gestante }: DadosGestanteProps) {
  const campos = [
    { rotulo: 'CPF', valor: mascararCpf(gestante.cpf) },
    { rotulo: 'Telefone', valor: mascararTelefone(gestante.telefone) },
    { rotulo: 'E-mail', valor: gestante.email ?? '—' },
    { rotulo: 'Nascimento', valor: formatarData(gestante.dataNascimento) },
    { rotulo: 'Idade gestacional', valor: idadeGestacional(gestante.dum) },
    { rotulo: 'Data provável do parto', valor: formatarData(gestante.dataProvavelParto) },
    { rotulo: 'Pontos', valor: String(gestante.saldoPontos) },
    { rotulo: 'Médico responsável', valor: gestante.medico },
  ]

  return (
    <section className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="font-semibold text-zinc-900">Dados da gestante</h2>
        <SituacaoConta primeiroAcessoPendente={gestante.primeiroAcessoPendente} />
      </div>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4">
        {campos.map((campo) => (
          <div key={campo.rotulo} className="flex flex-col gap-0.5">
            <dt className="text-[13px] text-zinc-500">{campo.rotulo}</dt>
            <dd className="text-zinc-900 tabular-nums">{campo.valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
