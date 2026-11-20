import { useEffect, useState } from 'react'

// O "agora" que se atualiza sozinho: com a aba aberta, o que depende da hora (saudação, data)
// acompanha o relógio sem esperar outro render. O timer é limpo ao desmontar.
export function useAgora(intervaloMs = 60_000) {
  const [agora, setAgora] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), intervaloMs)
    return () => clearInterval(timer)
  }, [intervaloMs])

  return agora
}
