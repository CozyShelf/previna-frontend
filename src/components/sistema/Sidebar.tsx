import { NavLink } from 'react-router-dom'

import { Icone } from '@/components/common/Icone'
import PrevinaLogo from '@/components/common/PrevinaLogo'
import { ITENS_MENU } from '@/components/sistema/menu'
import { perfilDaSessao } from '@/lib/auth'

export function Sidebar() {
  const itens = ITENS_MENU[perfilDaSessao() ?? ''] ?? []

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-zinc-100/60">
      <div className="flex h-14 shrink-0 items-center border-b border-zinc-200 px-5">
        <PrevinaLogo />
      </div>

      <nav aria-label="Menu principal" className="flex flex-col gap-0.5 p-3">
        {itens.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className="group flex h-9 items-center gap-2.5 rounded-md px-3 font-medium text-zinc-600 transition-colors hover:bg-zinc-200/60 hover:text-zinc-900 aria-[current=page]:bg-white aria-[current=page]:text-zinc-900 aria-[current=page]:shadow-xs aria-[current=page]:ring-1 aria-[current=page]:ring-zinc-200"
          >
            <Icone
              nome={item.icone}
              className="size-4 text-zinc-500 group-aria-[current=page]:text-previna-600"
            />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
