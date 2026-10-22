import { Link } from 'react-router-dom'

import BUTTON_CLASSES from '@/types/ButtonClasses'
import { Button } from '../common/Button'
import { Icone } from '../common/Icone'

export interface EmpresaCadastrada {
  razaoSocial: string
  email: string
}

export interface EmpresaPreCadastradaProps {
  empresa: EmpresaCadastrada
  onNovoCadastro: () => void
}

export function EmpresaPreCadastrada({ empresa, onNovoCadastro }: EmpresaPreCadastradaProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex gap-4 px-6 py-6">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Icone nome="sucesso" className="size-5" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-zinc-900">
            Empresa pré-cadastrada e pré-login enviado
          </h2>
          <p className="text-zinc-600">
            O login e a senha temporários de <strong>{empresa.razaoSocial}</strong> foram enviados
            para <strong>{empresa.email}</strong>. No primeiro acesso ao portal, a empresa cria o
            próprio login e senha e completa o cadastro.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 rounded-b-lg border-t border-zinc-200 bg-zinc-50 px-6 py-4">
        <Link to="/empresas" className={BUTTON_CLASSES.secondary}>
          Voltar para empresas
        </Link>
        <Button label="Cadastrar outra empresa" style="primary" onClick={onNovoCadastro} />
      </div>
    </section>
  )
}
