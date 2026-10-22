import { describe, expect, it } from 'vitest'

import { idadeGestacional } from '@/lib/datas'

describe('idadeGestacional', () => {
  it.each([
    ['2026-10-13', '1 semana'],
    ['2026-10-12', '1 semana e 1 dia'],
    ['2026-08-01', '11 semanas e 3 dias'],
  ])('DUM %s -> %s', (dum, esperado) => {
    expect(idadeGestacional(dum, new Date('2026-10-20T10:00'))).toBe(esperado)
  })
})
