import { useId, type ReactNode, type SelectHTMLAttributes } from 'react'

import { Icone } from './Icone'

export interface SelectGroupProps extends SelectHTMLAttributes<HTMLSelectElement> {
  labelTxt: string
  opcoes: { valor: string; rotulo: string }[]
  // Rótulo da primeira opção, de valor vazio: nada escolhido
  vazio: string
  hint?: ReactNode
  erro?: string
}

// Lista suspensa com o mesmo visual e a mesma exibição de erro do InputGroup
export function SelectGroup({
  labelTxt,
  opcoes,
  vazio,
  hint,
  erro,
  className = '',
  ...selectProps
}: SelectGroupProps) {
  const selectId = useId()
  const erroId = `${selectId}-erro`
  const borda = erro
    ? 'border-red-600 focus:border-red-600 focus:ring-red-600/15'
    : 'border-zinc-300 focus:border-previna-600 focus:ring-previna-600/15'

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={selectId} className="text-[13px] font-medium text-zinc-700">
          {labelTxt}
        </label>
        {hint && <span className="text-xs text-zinc-500">{hint}</span>}
      </div>
      <select
        id={selectId}
        defaultValue=""
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? erroId : undefined}
        {...selectProps}
        className={`h-9 w-full rounded-md border bg-white px-3 text-sm text-zinc-900 focus:ring-3 focus:outline-none ${borda}`}
      >
        <option value="">{vazio}</option>
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
      {erro && (
        <p id={erroId} className="flex items-start gap-1.5 text-xs text-red-700">
          <Icone nome="alerta" className="mt-px size-3.5 shrink-0" />
          {erro}
        </p>
      )}
    </div>
  )
}
