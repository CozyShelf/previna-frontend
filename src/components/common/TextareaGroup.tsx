import { useId, type ReactNode, type TextareaHTMLAttributes } from 'react'

import { Icone } from './Icone'

export interface TextareaGroupProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  labelTxt: string
  hint?: ReactNode
  erro?: string
}

// Mesmo visual e mesma exibição de erro do InputGroup, para os textos que não cabem em uma linha
// (o corpo do conteúdo educativo)
export function TextareaGroup({
  labelTxt,
  hint,
  erro,
  rows = 8,
  className = '',
  ...textareaProps
}: TextareaGroupProps) {
  const textareaId = useId()
  const erroId = `${textareaId}-erro`
  const borda = erro
    ? 'border-red-600 focus:border-red-600 focus:ring-red-600/15'
    : 'border-zinc-300 focus:border-previna-600 focus:ring-previna-600/15'

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={textareaId} className="text-[13px] font-medium text-zinc-700">
          {labelTxt}
        </label>
        {hint && <span className="text-xs text-zinc-500">{hint}</span>}
      </div>
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? erroId : undefined}
        {...textareaProps}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:ring-3 focus:outline-none ${borda}`}
      />
      {erro && (
        <p id={erroId} className="flex items-start gap-1.5 text-xs text-red-700">
          <Icone nome="alerta" className="mt-px size-3.5 shrink-0" />
          {erro}
        </p>
      )}
    </div>
  )
}
