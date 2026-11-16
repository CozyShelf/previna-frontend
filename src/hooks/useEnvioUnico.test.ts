import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useEnvioUnico } from './useEnvioUnico'

// Promessa resolvida de fora, para segurar o envio "em voo" durante o teste
function pendente() {
  let resolver!: () => void
  const promessa = new Promise<void>((r) => (resolver = r))
  return { promessa, resolver }
}

describe('useEnvioUnico', () => {
  it('ignora a segunda chamada enquanto a primeira não termina', async () => {
    const { result } = renderHook(() => useEnvioUnico())
    const envio = pendente()
    const acao = vi.fn(() => envio.promessa)

    let primeira!: Promise<void>
    act(() => {
      // As duas no mesmo tick, antes de o estado "enviando" chegar ao render
      primeira = result.current.enviar(acao)
      void result.current.enviar(acao)
    })

    expect(acao).toHaveBeenCalledTimes(1)
    expect(result.current.enviando).toBe(true)

    await act(async () => {
      envio.resolver()
      await primeira
    })
    expect(result.current.enviando).toBe(false)
  })

  it('libera de novo depois que o envio termina, mesmo com erro', async () => {
    const { result } = renderHook(() => useEnvioUnico())
    const falha = vi.fn(() => Promise.reject(new Error('falhou')))

    await act(async () => {
      await expect(result.current.enviar(falha)).rejects.toThrow('falhou')
    })
    expect(result.current.enviando).toBe(false)

    const acao = vi.fn(() => Promise.resolve())
    await act(() => result.current.enviar(acao))
    expect(acao).toHaveBeenCalledTimes(1)
  })
})
