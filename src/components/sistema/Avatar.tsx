const TAMANHOS = {
  sm: 'size-7 text-xs',
  lg: 'size-12 text-base',
}

export interface AvatarProps {
  nome?: string
  tamanho?: keyof typeof TAMANHOS
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/)
  return `${partes[0]?.charAt(0) ?? ''}${partes.length > 1 ? (partes.at(-1)?.charAt(0) ?? '') : ''}`
}

export function Avatar({ nome, tamanho = 'sm' }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-previna-100 font-semibold text-previna-700 ${TAMANHOS[tamanho]}`}
    >
      {nome && iniciais(nome)}
    </span>
  )
}
