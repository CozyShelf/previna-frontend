import { act } from '@testing-library/react'

// Dois cliques no mesmo tick, antes de o botão desabilitado chegar ao render: só a guarda
// síncrona do useEnvioUnico barra o segundo
export function cliqueDuplo(botao: HTMLElement) {
  act(() => {
    botao.click()
    botao.click()
  })
}

// Requisições que gravam algo; as leituras (GET, sem method) ficam de fora
export function escritas(fetch: { mock: { calls: Parameters<typeof globalThis.fetch>[] } }) {
  return fetch.mock.calls.filter(([, init]) => init?.method && init.method !== 'GET')
}
