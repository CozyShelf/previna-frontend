import { describe, expect, it } from 'vitest'

import { cnpjValido, cpfValido } from '@/lib/validacoes'

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

describe('cnpjValido', () => {
  it.each([
    ['11222333000181', true],
    ['12345678000195', true],
    ['11222333000182', false],
    ['00000000000000', false],
    ['1122233300018', false],
    ['11.222.333/0001-81', false],
  ])('%s -> %s', (cnpj, esperado) => {
    expect(cnpjValido(cnpj)).toBe(esperado)
  })
})
