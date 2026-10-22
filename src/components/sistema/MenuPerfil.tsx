import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Icone } from '@/components/common/Icone'
import { identificacao, imagemDoPerfil, type Perfil } from '@/hooks/usePerfil'
import { encerrarSessao } from '@/lib/auth'
import { Avatar } from './Avatar'

const ITEM_CLASSES =
  'flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'

export interface MenuPerfilProps {
  perfil?: Perfil
}

export function MenuPerfil({ perfil }: MenuPerfilProps) {
  const navigate = useNavigate()
  const [aberto, setAberto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function fecharAoClicarFora(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setAberto(false)
    }
    function fecharComEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') setAberto(false)
    }
    document.addEventListener('mousedown', fecharAoClicarFora)
    document.addEventListener('keydown', fecharComEsc)
    return () => {
      document.removeEventListener('mousedown', fecharAoClicarFora)
      document.removeEventListener('keydown', fecharComEsc)
    }
  }, [])

  function sair() {
    encerrarSessao()
    navigate('/login', { replace: true })
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        className="flex h-9 cursor-pointer items-center gap-2.5 rounded-md pr-2 pl-1 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-previna-600"
      >
        <Avatar nome={perfil?.nome} imagem={imagemDoPerfil(perfil)} />
        <span className="font-medium text-zinc-800">{perfil?.nome}</span>
        <Icone nome="expandir" className="size-4 text-zinc-500" />
      </button>

      {aberto && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1.5 w-64 rounded-lg border border-zinc-200 bg-white shadow-lg"
        >
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="font-medium text-zinc-900">{perfil?.nome}</p>
            <p className="text-xs text-zinc-500">{perfil && identificacao(perfil)}</p>
          </div>
          <div className="p-1">
            <Link
              to="/perfil"
              role="menuitem"
              onClick={() => setAberto(false)}
              className={ITEM_CLASSES}
            >
              <Icone nome="perfil" className="size-4 text-zinc-500" />
              Meu perfil
            </Link>
            <button type="button" role="menuitem" onClick={sair} className={ITEM_CLASSES}>
              <Icone nome="sair" className="size-4 text-zinc-500" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
