// aaaa-mm-dd -> dd/mm/aaaa
export const formatarData = (data: string) => data.split('-').reverse().join('/')
const plural = (n: number, singular: string, plural: string) =>
  `${n} ${n === 1 ? singular : plural}`

// DUM em aaaa-mm-dd -> "11 semanas e 3 dias"
export function idadeGestacional(dum: string, hoje = new Date()) {
  const dias = Math.floor((hoje.getTime() - new Date(`${dum}T00:00`).getTime()) / 86_400_000)
  const semanas = plural(Math.floor(dias / 7), 'semana', 'semanas')
  return dias % 7 ? `${semanas} e ${plural(dias % 7, 'dia', 'dias')}` : semanas
}
