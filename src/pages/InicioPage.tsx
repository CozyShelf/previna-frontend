import logo from '@/assets/images/logo.png'
import { AgendaDoDia } from '@/components/agendamento/AgendaDoDia'
import { useAgora } from '@/hooks/useAgora'
import { usePerfil } from '@/hooks/usePerfil'
import { perfilDaSessao } from '@/lib/auth'
import { saudacaoPara } from '@/lib/datas'

const hoje = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' })

export function InicioPage() {
  const perfil = usePerfil()
  // Atualiza a cada minuto, para a saudação e a data virarem com a aba aberta
  const agora = useAgora()
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
            {saudacaoPara(agora.getHours())}
            {perfil && `, ${perfil.nome}`}
          </h1>
          <p className="text-zinc-600 first-letter:uppercase">{hoje.format(agora)}</p>
        </div>

        {medico && <AgendaDoDia />}
      </div>
    </>
  )
}
