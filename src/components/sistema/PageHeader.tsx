import type { ReactNode } from 'react'

export interface PageHeaderProps {
  titulo: string
  descricao?: string
  acoes?: ReactNode
}

export function PageHeader({ titulo, descricao, acoes }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{titulo}</h1>
        {descricao && <p className="text-zinc-600">{descricao}</p>}
      </div>
      {acoes}
    </div>
  )
}
