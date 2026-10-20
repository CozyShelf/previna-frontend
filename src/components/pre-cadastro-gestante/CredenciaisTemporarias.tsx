import { Link } from 'react-router-dom'

import BUTTON_CLASSES from '@/types/ButtonClasses'
import { Button } from '../common/Button'
import { Icone } from '../common/Icone'

export interface Credenciais {
  login: string
  senha: string
}

export interface CredenciaisTemporariasProps {
  credenciais: Credenciais
  onNovoCadastro: () => void
}

export function CredenciaisTemporarias({
  credenciais,
  onNovoCadastro,
}: CredenciaisTemporariasProps) {
  const campos = [
    { label: 'Login', valor: credenciais.login },
    { label: 'Senha temporária', valor: credenciais.senha },
  ]

  return (
    <section className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex gap-4 px-6 py-6">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Icone nome="sucesso" className="size-5" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-zinc-900">Gestante cadastrada</h2>
          <p className="text-zinc-600">
            Entregue o login e a senha abaixo à gestante. A senha não poderá ser consultada
            novamente.
          </p>

          <dl className="mt-4 grid w-fit grid-cols-2 divide-x divide-zinc-200 rounded-md border border-zinc-200">
            {campos.map((campo) => (
              <div key={campo.label} className="flex flex-col gap-1 px-5 py-3">
                <dt className="text-xs text-zinc-500">{campo.label}</dt>
                <dd className="text-lg font-semibold tracking-wide text-zinc-900">{campo.valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="flex justify-end gap-3 rounded-b-lg border-t border-zinc-200 bg-zinc-50 px-6 py-4">
        <Link to="/gestantes" className={BUTTON_CLASSES.secondary}>
          Voltar para gestantes
        </Link>
        <Button label="Cadastrar outra gestante" style="primary" onClick={onNovoCadastro} />
      </div>
    </section>
  )
}
