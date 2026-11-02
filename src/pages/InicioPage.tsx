import logo from '@/assets/images/logo.png'
import { AgendaDoDia } from '@/components/agendamento/AgendaDoDia'
import { usePerfil } from '@/hooks/usePerfil'
import { perfilDaSessao } from '@/lib/auth'

function saudacao() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

const hoje = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' })

export function InicioPage() {
  const perfil = usePerfil()
  // Só o médico tem agenda; os demais perfis continuam com a tela de boas-vindas
  const medico = perfilDaSessao() === 'MEDICO'

  return (
    <>
      {!medico && (
        <img
          src={logo}
          alt=""
          className="pointer-events-none absolute top-1/2 left-1/2 w-[420px] -translate-x-1/2 -translate-y-1/2 opacity-20 blur-[3px] grayscale select-none"
        />
      )}

      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">
            {saudacao()}
            {perfil && `, ${perfil.nome}`}
          </h1>
          <p className="text-zinc-600 first-letter:uppercase">{hoje.format(new Date())}</p>
        </div>

        {medico && <AgendaDoDia />}
      </div>
    </>
  )
}
