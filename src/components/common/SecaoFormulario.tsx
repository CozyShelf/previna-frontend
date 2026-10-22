import type { ReactNode } from 'react'

export interface SecaoFormularioProps {
  titulo: string
  descricao?: string
  children: ReactNode
}

export function SecaoFormulario({ titulo, descricao, children }: SecaoFormularioProps) {
  return (
    <section className="grid grid-cols-[220px_1fr] gap-8 px-6 py-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-zinc-900">{titulo}</h2>
        {descricao && <p className="text-[13px] text-zinc-500">{descricao}</p>}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">{children}</div>
    </section>
  )
}
