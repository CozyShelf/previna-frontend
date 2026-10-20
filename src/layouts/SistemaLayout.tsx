import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { MenuPerfil } from '@/components/sistema/MenuPerfil'
import { Sidebar } from '@/components/sistema/Sidebar'
import { Trilha } from '@/components/sistema/Trilha'
import type { PerfilMedico } from '@/hooks/usePerfilMedico'
import { get } from '@/lib/api'

export function SistemaLayout() {
  const [perfil, setPerfil] = useState<PerfilMedico>()

  useEffect(() => {
    get<PerfilMedico>('/medicos/perfil').then(setPerfil)
  }, [])

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-6 border-b border-zinc-200 bg-white px-8">
          <Trilha />
          <MenuPerfil perfil={perfil} />
        </header>

        <main className="relative flex-1 overflow-y-auto bg-zinc-50">
          <div className="mx-auto max-w-5xl px-8 py-8">
            <Outlet context={perfil} />
          </div>
        </main>
      </div>
    </div>
  )
}
