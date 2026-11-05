import type { ButtonProps } from '@/components/common/Button'

const BASE =
  'inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md px-3.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-previna-600 disabled:cursor-not-allowed disabled:opacity-60'

const BUTTON_CLASSES: Record<ButtonProps['style'], string> = {
  primary: `${BASE} bg-previna-600 text-white hover:bg-previna-700`,
  secondary: `${BASE} border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50`,
}

// Ações no fim da linha das listagens: azul edita, vermelho exclui. A cor da marca (previna-600)
// é vermelha e deixava as duas ações com a mesma cor
export const ACAO_LISTAGEM = {
  editar: 'font-medium text-blue-600 hover:text-blue-700',
  excluir: 'font-medium text-red-600 hover:text-red-700 disabled:opacity-50',
}

export default BUTTON_CLASSES
