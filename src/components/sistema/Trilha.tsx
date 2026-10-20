import { Link, useMatches, type UIMatch } from 'react-router-dom'

import { Icone } from '@/components/common/Icone'
import BUTTON_CLASSES from '@/types/ButtonClasses'

export interface HandleRota {
  titulo: string
}

export function Trilha() {
  const trilha = (useMatches() as UIMatch<unknown, HandleRota | undefined>[])
    .filter((match) => match.handle?.titulo)
    .map((match) => ({ caminho: match.pathname, titulo: match.handle!.titulo }))
  const anterior = trilha.at(-2)

  return (
    <div className="flex items-center gap-4">
      {anterior && (
        <Link to={anterior.caminho} className={BUTTON_CLASSES.secondary}>
          <Icone nome="voltar" />
          Voltar
        </Link>
      )}

      <nav aria-label="Trilha de navegação">
        <ol className="flex items-center gap-1.5">
          {trilha.map((item, indice) => (
            <li key={item.caminho} className="flex items-center gap-1.5">
              {indice > 0 && <Icone nome="separador" className="size-3.5 text-zinc-400" />}
              {indice === trilha.length - 1 ? (
                <span aria-current="page" className="font-medium text-zinc-900">
                  {item.titulo}
                </span>
              ) : (
                <Link to={item.caminho} className="text-zinc-500 hover:text-zinc-900">
                  {item.titulo}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
}
