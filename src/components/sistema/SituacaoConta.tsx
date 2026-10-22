export interface SituacaoContaProps {
  primeiroAcessoPendente: boolean
}

export function SituacaoConta({ primeiroAcessoPendente }: SituacaoContaProps) {
  return primeiroAcessoPendente ? (
    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-amber-800 ring-1 ring-amber-200">
      Aguardando primeiro acesso
    </span>
  ) : (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
      Ativa
    </span>
  )
}
