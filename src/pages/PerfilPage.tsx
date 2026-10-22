import { FormPerfilEmpresa } from '@/components/perfil-empresa/FormPerfilEmpresa'
import { Avatar } from '@/components/sistema/Avatar'
import { PageHeader } from '@/components/sistema/PageHeader'
import { identificacao, imagemDoPerfil, usePerfil, useRecarregarPerfil } from '@/hooks/usePerfil'
import { perfilDaSessao } from '@/lib/auth'

export function PerfilPage() {
  const perfil = usePerfil()
  const recarregarPerfil = useRecarregarPerfil()
  // Por enquanto só a empresa parceira edita os próprios dados pelo web
  const editavel = perfilDaSessao() === 'EMPRESA_PARCEIRA'

  if (!perfil) return null

  const campos = [
    ...(editavel ? [] : [{ label: 'E-mail', valor: perfil.email ?? 'Não informado' }]),
    { label: 'Login', valor: perfil.login },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Meu perfil"
        descricao={
          editavel
            ? 'Dados da sua conta no Previna. Mantenha o contato e os dados da empresa em dia.'
            : 'Dados da sua conta no Previna.'
        }
      />

      <section className="rounded-lg border border-zinc-200 bg-white">
        <div className="flex items-center gap-4 border-b border-zinc-200 px-6 py-5">
          <Avatar nome={perfil.nome} imagem={imagemDoPerfil(perfil)} tamanho="lg" />
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

      {editavel && <FormPerfilEmpresa onSalvo={recarregarPerfil} />}
    </div>
  )
}
