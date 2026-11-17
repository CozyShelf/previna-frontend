import { useCallback, useRef, useState } from 'react'

// Evita o envio duplicado do clique duplo. O estado desabilita o botão, mas só vale no próximo
// render: dois cliques no mesmo frame passariam os dois. A ref barra na hora a segunda chamada
// enquanto a primeira não termina. É só conforto: a proteção de verdade fica no backend.
export function useEnvioUnico() {
  const emAndamento = useRef(false)
  const [enviando, setEnviando] = useState(false)

  // A ação trata os próprios erros; aqui só se garante que ela não roda duas vezes ao mesmo tempo
  const enviar = useCallback(async (acao: () => Promise<void>) => {
    if (emAndamento.current) return
    emAndamento.current = true
    setEnviando(true)
    try {
      await acao()
    } finally {
      emAndamento.current = false
      setEnviando(false)
    }
  }, [])

  return { enviando, enviar }
}
