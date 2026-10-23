const TAMANHOS = {
  sm: 'size-7 text-xs',
  lg: 'size-12 text-base',
}

export interface AvatarProps {
  nome?: string
  // Imagem (ex.: logo da empresa parceira) no lugar das iniciais
  imagem?: string
  tamanho?: keyof typeof TAMANHOS
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/)
  return `${partes[0]?.charAt(0) ?? ''}${partes.length > 1 ? (partes.at(-1)?.charAt(0) ?? '') : ''}`
}

export function Avatar({ nome, imagem, tamanho = 'sm' }: AvatarProps) {
  if (imagem) {
    return (
      <img
        src={imagem}
        alt=""
        aria-hidden="true"
        className={`shrink-0 rounded-full bg-white object-contain ring-1 ring-zinc-200 ${TAMANHOS[tamanho]}`}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-previna-100 font-semibold text-previna-700 ${TAMANHOS[tamanho]}`}
    >
      {nome && iniciais(nome)}
    </span>
  )
}
