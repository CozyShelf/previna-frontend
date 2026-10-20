import { describe, expect, it } from 'vitest'

import { cpfValido } from '@/lib/validacoes'

describe('cpfValido', () => {
  it.each([
    ['52998224725', true],
    ['11144477735', true],
    ['53341037839', false],
    ['52998224724', false],
    ['11111111111', false],
    ['5299822472', false],
    ['529.982.247-25', false],
  ])('%s -> %s', (cpf, esperado) => {
    expect(cpfValido(cpf)).toBe(esperado)
  })
})
