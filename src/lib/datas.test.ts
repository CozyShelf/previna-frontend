import { describe, expect, it } from 'vitest'

import { formatarDataHora, idadeGestacional, saudacaoPara } from '@/lib/datas'

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

describe('saudacaoPara', () => {
  // A tela passa getHours() da hora local; os minutos só mostram onde fica cada limite
  it.each([
    ['00:00', 'Boa noite'],
    ['04:59', 'Boa noite'],
    ['05:00', 'Bom dia'],
    ['11:59', 'Bom dia'],
    ['12:00', 'Boa tarde'],
    ['17:59', 'Boa tarde'],
    ['18:00', 'Boa noite'],
    ['23:59', 'Boa noite'],
  ])('%s -> %s', (horario, esperado) => {
    const [hora, minuto] = horario.split(':').map(Number)
    expect(saudacaoPara(new Date(2030, 0, 15, hora, minuto).getHours())).toBe(esperado)
  })
})
