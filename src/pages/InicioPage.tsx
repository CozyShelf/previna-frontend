import type { ComponentType } from 'react'

import { AgendaDoDia } from '@/components/agendamento/AgendaDoDia'
import { PainelAdmin } from '@/components/painel/PainelAdmin'
import { PainelEmpresa } from '@/components/painel/PainelEmpresa'
import { PainelMedico } from '@/components/painel/PainelMedico'
import { useAgora } from '@/hooks/useAgora'
import { usePerfil } from '@/hooks/usePerfil'
import { perfilDaSessao } from '@/lib/auth'
import { saudacaoPara } from '@/lib/datas'

const hoje = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' })

// Cada perfil tem o seu painel, que chama só a própria rota /painel/*
const PAINEIS: Record<string, ComponentType> = {
  MEDICO: PainelMedico,
  EMPRESA_PARCEIRA: PainelEmpresa,
  ADMIN: PainelAdmin,
}

export function InicioPage() {
  const perfil = usePerfil()
  // Atualiza a cada minuto, para a saudação e a data virarem com a aba aberta
  const agora = useAgora()
  const perfilSessao = perfilDaSessao() ?? ''
  const Painel = PAINEIS[perfilSessao]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {saudacaoPara(agora.getHours())}
          {perfil && `, ${perfil.nome}`}
        </h1>
        <p className="text-zinc-600 first-letter:uppercase">{hoje.format(agora)}</p>
      </div>

      {/* A agenda do dia fica fora do painel: um erro no painel não a esconde */}
      {perfilSessao === 'MEDICO' && <AgendaDoDia />}
      {Painel && <Painel />}
    </div>
  )
}
