import type { MouseEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

// Elementos que já têm ação própria: o clique neles não é da linha
const INTERATIVOS = 'a, button, input, select, textarea, label, summary, [role="button"]'

export interface LinhaClicavelProps {
  // Destino da linha: o mesmo do link principal que ela contém
  para: string
  children: ReactNode
}

// Linha de tabela que leva a `para` quando clicada em qualquer ponto. Só o mouse: o teclado e o leitor de tela
// continuam usando o link principal da linha (ex.: o nome), que também mantém o "abrir em nova aba"
export function LinhaClicavel({ para, children }: LinhaClicavelProps) {
  const navigate = useNavigate()

  function aoClicar(evento: MouseEvent<HTMLTableRowElement>) {
    // Ctrl/Cmd/Shift/Alt e outros botões ficam com o navegador; e quem selecionou texto (para copiar o CPF,
    // por exemplo) não quer sair da página
    if (evento.defaultPrevented || evento.button !== 0) return
    if (evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return
    if (window.getSelection()?.toString()) return
    const alvo = evento.target as Element
    const interativo = alvo.closest(INTERATIVOS)
    if (interativo && evento.currentTarget.contains(interativo)) return
    navigate(para)
  }

  return (
    <tr onClick={aoClicar} className="cursor-pointer transition-colors hover:bg-zinc-50">
      {children}
    </tr>
  )
}
