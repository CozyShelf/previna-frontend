import logo from '@/assets/images/logo.png'
import PrevinaLogo from '@/components/common/PrevinaLogo'
import { FormLoginMedico } from '@/components/medico-login/FormLoginMedico'

export function MedicoLoginPage() {
  return (
    <div className="grid h-dvh lg:grid-cols-[minmax(0,1fr)_520px]">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-zinc-200 bg-zinc-50 p-12 lg:flex">
        <PrevinaLogo />

        <img
          src={logo}
          alt=""
          className="pointer-events-none absolute -right-28 -bottom-28 w-[560px] opacity-20 blur-[3px] grayscale select-none"
        />

        <div className="relative flex max-w-md flex-col gap-3">
          <p className="font-brand text-3xl leading-tight font-semibold text-zinc-900">
            Cada consulta de pré-natal conta.
          </p>
          <p className="text-zinc-600">
            Programa de incentivo ao pré-natal para gestantes de primeira viagem.
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-8">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="lg:hidden">
            <PrevinaLogo />
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight">Entrar no Previna</h1>
            <p className="text-zinc-600">Acesso exclusivo para médicos.</p>
          </div>

          <FormLoginMedico />
        </div>
      </main>
    </div>
  )
}
