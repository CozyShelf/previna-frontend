import { describe, expect, it } from 'vitest'

import { mascararCnpj, mascararCpf, mascararTelefone } from '@/lib/mascaras'

describe('mascararCpf', () => {
  it.each([
    ['123', '123'],
    ['1234', '123.4'],
    ['1234567', '123.456.7'],
    ['1234567890', '123.456.789-0'],
    ['12345678901', '123.456.789-01'],
    ['123.456.789-01999', '123.456.789-01'],
    ['abc', ''],
  ])('%s -> %s', (valor, esperado) => {
    expect(mascararCpf(valor)).toBe(esperado)
  })
})

describe('mascararTelefone', () => {
  it.each([
    ['11', '11'],
    ['119', '(11) 9'],
    ['1198765', '(11) 98765'],
    ['1123456789', '(11) 2345-6789'],
    ['11987654321', '(11) 98765-4321'],
    ['(11) 98765-43219', '(11) 98765-4321'],
  ])('%s -> %s', (valor, esperado) => {
    expect(mascararTelefone(valor)).toBe(esperado)
  })
})

describe('mascararCnpj', () => {
  it.each([
    ['12', '12'],
    ['123', '12.3'],
    ['123456', '12.345.6'],
    ['123456780', '12.345.678/0'],
    ['12345678000195', '12.345.678/0001-95'],
    ['12.345.678/0001-95999', '12.345.678/0001-95'],
    ['abc', ''],
  ])('%s -> %s', (valor, esperado) => {
    expect(mascararCnpj(valor)).toBe(esperado)
  })
})
