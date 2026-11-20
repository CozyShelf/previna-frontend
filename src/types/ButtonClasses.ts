import type { ButtonProps } from '@/components/common/Button'

const COMUM =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-previna-600 disabled:cursor-not-allowed disabled:opacity-60'
const BASE = `${COMUM} h-9 px-3.5 text-sm`
const PRIMARIO = 'bg-previna-600 text-white hover:bg-previna-700'

const BUTTON_CLASSES: Record<ButtonProps['style'], string> = {
  primary: `${BASE} ${PRIMARIO}`,
  secondary: `${BASE} border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50`,
}

// A ação principal da tela, maior que os outros botões (ex.: "Validar cupom" no início da empresa).
// Tamanho próprio em vez de somar classes ao primary: h-9 e h-12 juntos dependem da ordem do CSS gerado
export const BOTAO_PRIMARIO_GRANDE = `${COMUM} h-12 px-6 text-base ${PRIMARIO}`

// Ações no fim da linha das listagens: azul edita, vermelho exclui. A cor da marca (previna-600)
// é vermelha e deixava as duas ações com a mesma cor
export const ACAO_LISTAGEM = {
  editar: 'font-medium text-blue-600 hover:text-blue-700',
  excluir: 'font-medium text-red-600 hover:text-red-700 disabled:opacity-50',
}

export default BUTTON_CLASSES
