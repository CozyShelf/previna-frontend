import { Avatar } from '@/components/sistema/Avatar'
import { PageHeader } from '@/components/sistema/PageHeader'
import { identificacao, usePerfil } from '@/hooks/usePerfil'

export function PerfilPage() {
  const perfil = usePerfil()

  if (!perfil) return null

  const campos = [
    { label: 'E-mail', valor: perfil.email ?? 'Não informado' },
    { label: 'Login', valor: perfil.login },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader titulo="Meu perfil" descricao="Dados da sua conta no Previna." />

      <section className="rounded-lg border border-zinc-200 bg-white">
        <div className="flex items-center gap-4 border-b border-zinc-200 px-6 py-5">
          <Avatar nome={perfil.nome} tamanho="lg" />
          <div>
            <p className="text-base font-semibold text-zinc-900">{perfil.nome}</p>
            <p className="text-zinc-500">{identificacao(perfil)}</p>
          </div>
        </div>

        <dl className="divide-y divide-zinc-100">
          {campos.map((campo) => (
            <div key={campo.label} className="grid grid-cols-[200px_1fr] gap-4 px-6 py-3.5">
              <dt className="text-zinc-500">{campo.label}</dt>
              <dd className="text-zinc-900">{campo.valor}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
