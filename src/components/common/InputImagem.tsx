import { useEffect, useId, useRef, useState, type ChangeEvent, type FocusEvent } from 'react'

import { Icone } from './Icone'

export interface InputImagemProps {
  labelTxt: string
  name: string
  accept: string
  hint?: string
  descricao?: string
  erro?: string
  // Imagem já salva, mostrada até escolherem outra ou removerem
  atual?: string
  // Mostra "Remover" e, ao remover, envia este campo como "true" para o backend apagar a imagem salva
  nomeRemover?: string
  className?: string
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void
}

// Escolha de uma imagem do computador, com pré-visualização
export function InputImagem({
  labelTxt,
  name,
  accept,
  hint,
  descricao,
  erro,
  atual,
  nomeRemover,
  className = '',
  onChange,
  onBlur,
}: InputImagemProps) {
  const inputId = useId()
  const erroId = `${inputId}-erro`
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string>()
  const [removida, setRemovida] = useState(false)
  const exibida = preview ?? (removida ? undefined : atual)

  // Libera a URL temporária da imagem anterior ao trocar de arquivo ou sair da tela
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )

  function escolher(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.currentTarget.files?.[0]
    setPreview(arquivo?.type.startsWith('image/') ? URL.createObjectURL(arquivo) : undefined)
    // Cancelar a janela de arquivos também dispara change sem arquivo; isso não remove a imagem salva
    if (arquivo) setRemovida(false)
    onChange?.(e)
  }

  function remover() {
    const input = inputRef.current!
    input.value = ''
    // Limpar por código não dispara o change; dispara para atualizar a pré-visualização e a validação
    input.dispatchEvent(new Event('change', { bubbles: true }))
    setRemovida(true)
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="text-[13px] font-medium text-zinc-700">
          {labelTxt}
        </label>
        {hint && <span className="text-xs text-zinc-500">{hint}</span>}
      </div>
      <div className="flex items-center gap-4">
        <span
          className={`flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-zinc-50 text-zinc-400 ${erro ? 'border-red-600' : 'border-zinc-200'}`}
        >
          {exibida ? (
            <img src={exibida} alt="Pré-visualização" className="size-full object-contain" />
          ) : (
            <Icone nome="imagem" className="size-6" />
          )}
        </span>
        <div className="flex min-w-0 flex-col gap-1.5">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            name={name}
            accept={accept}
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? erroId : undefined}
            onChange={escolher}
            onBlur={onBlur}
            className="max-w-full text-sm text-zinc-600 file:mr-3 file:h-9 file:cursor-pointer file:rounded-md file:border file:border-solid file:border-zinc-300 file:bg-white file:px-3.5 file:text-sm file:font-medium file:text-zinc-800 hover:file:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-previna-600"
          />
          {descricao && <p className="text-xs text-zinc-500">{descricao}</p>}
        </div>
        {nomeRemover && exibida && (
          <button
            type="button"
            onClick={remover}
            className="ml-auto cursor-pointer text-sm font-medium text-red-700 hover:underline"
          >
            Remover
          </button>
        )}
        {nomeRemover && removida && <input type="hidden" name={nomeRemover} value="true" />}
      </div>
      {erro && (
        <p id={erroId} className="flex items-start gap-1.5 text-xs text-red-700">
          <Icone nome="alerta" className="mt-px size-3.5 shrink-0" />
          {erro}
        </p>
      )}
    </div>
  )
}
