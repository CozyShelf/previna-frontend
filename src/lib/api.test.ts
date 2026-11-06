import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, del, get, post, put, urlDaApi } from '@/lib/api'
import { obterToken } from '@/lib/auth'
import { entrarComo } from '@/test/sessao'

const assign = vi.fn()

beforeEach(() => {
  // O jsdom não navega: troca o location por um que só registra o destino
  vi.stubGlobal('location', { ...window.location, assign })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  assign.mockReset()
  localStorage.clear()
})

describe('api', () => {
  it('manda o token da sessão e o JSON do corpo', async () => {
    entrarComo('MEDICO')
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}'))

    await expect(post('/medicos', { nome: 'Ana' })).resolves.toEqual({ ok: true })

    const [caminho, init] = fetch.mock.calls[0]!
    expect(caminho).toBe(urlDaApi('/medicos'))
    expect(init?.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${obterToken()}`,
    })
    expect(init?.body).toBe('{"nome":"Ana"}')
  })

  it('envia FormData sem Content-Type, para o navegador montar o multipart', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))
    const dados = new FormData()

    await put('/empresas/perfil', dados)

    expect(fetch.mock.calls[0]?.[1]).toMatchObject({ method: 'PUT', body: dados, headers: {} })
  })

  it('usa GET e DELETE nos métodos correspondentes', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('{}'))

    await get('/a')
    await del('/b')

    expect(fetch.mock.calls[0]?.[1]?.method).toBeUndefined()
    expect(fetch.mock.calls[1]?.[1]?.method).toBe('DELETE')
  })

  it('com a sessão vencida (401), encerra a sessão e volta ao login', async () => {
    entrarComo('ADMIN')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }))

    await expect(get('/medicos')).rejects.toEqual(new ApiError(401))

    expect(localStorage.getItem('previna.token')).toBeNull()
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('no próprio login, o 401 é só credencial errada: não redireciona', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }))

    const erro = await post('/auth/login', {}).catch((e: unknown) => e)

    expect(erro).toBeInstanceOf(ApiError)
    expect((erro as ApiError).status).toBe(401)
    expect(assign).not.toHaveBeenCalled()
  })
})
