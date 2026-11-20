import { describe, expect, it } from 'vitest'

import { formatarDataHora, idadeGestacional } from '@/lib/datas'

describe('idadeGestacional', () => {
  it.each([
    ['2026-10-13', '1 semana'],
    ['2026-10-12', '1 semana e 1 dia'],
    ['2026-08-01', '11 semanas e 3 dias'],
  ])('DUM %s -> %s', (dum, esperado) => {
    expect(idadeGestacional(dum, new Date('2026-10-20T10:00'))).toBe(esperado)
  })
})

describe('formatarDataHora', () => {
  it('mostra data e hora no fuso local', () => {
    // Montado na hora local, para o teste não depender do fuso da máquina
    const instante = new Date(2026, 10, 19, 9, 5).toISOString()

    expect(formatarDataHora(instante)).toBe('19/11/2026 às 09:05')
  })
})
