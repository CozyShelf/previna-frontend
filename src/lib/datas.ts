// aaaa-mm-dd -> dd/mm/aaaa
export const formatarData = (data: string) => data.split('-').reverse().join('/')

const DATA = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })
const HORA = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' })

// Instante da API (ISO, ex.: 2026-11-19T16:45:00Z) -> "19/11/2026 às 13:45", no fuso do navegador
export function formatarDataHora(instante: string) {
  const data = new Date(instante)
  return `${DATA.format(data)} às ${HORA.format(data)}`
}

// sv-SE formata a data local como aaaa-mm-dd, o formato do input de data
export const hoje = () => new Date().toLocaleDateString('sv-SE')

const plural = (n: number, singular: string, plural: string) =>
  `${n} ${n === 1 ? singular : plural}`

// DUM em aaaa-mm-dd -> "11 semanas e 3 dias"
export function idadeGestacional(dum: string, hoje = new Date()) {
  const dias = Math.floor((hoje.getTime() - new Date(`${dum}T00:00`).getTime()) / 86_400_000)
  const semanas = plural(Math.floor(dias / 7), 'semana', 'semanas')
  return dias % 7 ? `${semanas} e ${plural(dias % 7, 'dia', 'dias')}` : semanas
}

// Hora local (0–23) -> saudação. A madrugada (0h–4h59) ainda é "Boa noite"
export function saudacaoPara(hora: number) {
  if (hora >= 5 && hora < 12) return 'Bom dia'
  if (hora >= 12 && hora < 18) return 'Boa tarde'
  return 'Boa noite'
}
