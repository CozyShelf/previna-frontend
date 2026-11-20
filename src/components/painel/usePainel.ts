import { useCallback, useEffect, useState } from 'react'

import { get } from '@/lib/api'

export interface EstadoDoPainel<T> {
  dados?: T
  erro: boolean
  tentarDeNovo: () => void
}

// Busca o painel do perfil. tentarDeNovo volta para o "carregando" e refaz a chamada
export function usePainel<T extends object>(caminho: string): EstadoDoPainel<T> {
  const [estado, setEstado] = useState<{ dados?: T; erro: boolean }>({ erro: false })
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    let vigente = true
    get<T>(caminho)
      .then((dados) => {
        if (!vigente) return
        // Corpo que não é um objeto (ex.: null) não tem o que mostrar: é erro, não tela em branco
        setEstado(dados && typeof dados === 'object' ? { dados, erro: false } : { erro: true })
      })
      .catch(() => vigente && setEstado({ erro: true }))
    return () => {
      vigente = false
    }
  }, [caminho, versao])

  const tentarDeNovo = useCallback(() => {
    setEstado({ erro: false })
    setVersao((atual) => atual + 1)
  }, [])

  return { ...estado, tentarDeNovo }
}
