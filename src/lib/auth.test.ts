import { afterEach, describe, expect, it } from 'vitest'

import {
  encerrarSessao,
  obterToken,
  perfilDaSessao,
  primeiroAcessoDoToken,
  salvarToken,
} from '@/lib/auth'
import { entrarComo, tokenDe } from '@/test/sessao'

afterEach(() => {
  localStorage.clear()
})

describe('auth', () => {
  it('lê o perfil e o primeiro acesso do token salvo', () => {
    entrarComo('EMPRESA_PARCEIRA', true)

    expect(perfilDaSessao()).toBe('EMPRESA_PARCEIRA')
    expect(primeiroAcessoDoToken(obterToken()!)).toBe(true)
  })

  it('sem sessão não há perfil', () => {
    expect(perfilDaSessao()).toBeUndefined()
  })

  it('descarta o token vencido', () => {
    const payload = btoa(JSON.stringify({ perfil: 'ADMIN', primeiroAcesso: false, exp: 1 }))
    salvarToken(`a.${payload}.b`)

    expect(obterToken()).toBeNull()
    expect(localStorage.getItem('previna.token')).toBeNull()
  })

  it('descarta o token que não dá para ler, em vez de quebrar a tela', () => {
    salvarToken('isto-nao-e-um-jwt')

    expect(obterToken()).toBeNull()
    expect(localStorage.getItem('previna.token')).toBeNull()
  })

  it('aceita o payload em base64url (com - e _)', () => {
    // Os "?" e ">" geram "/" e "+" no base64 comum, que o JWT troca por "_" e "-"
    const json = JSON.stringify({
      perfil: 'MEDICO',
      primeiroAcesso: false,
      exp: 2 ** 40,
      x: '??>>>',
    })
    const base64url = btoa(json).replace(/\+/g, '-').replace(/\//g, '_')
    expect(base64url).toMatch(/[-_]/)
    salvarToken(`a.${base64url}.b`)

    expect(perfilDaSessao()).toBe('MEDICO')
  })

  it('encerrar a sessão apaga o token', () => {
    salvarToken(tokenDe('ADMIN'))
    encerrarSessao()

    expect(obterToken()).toBeNull()
  })
})
