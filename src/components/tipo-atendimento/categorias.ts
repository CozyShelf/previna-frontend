// Categoria do tipo de exame ou consulta, igual ao CategoriaAtendimento do backend
export const CATEGORIAS = {
  EXAME: 'Exame',
  CONSULTA: 'Consulta',
} as const

export type CategoriaAtendimento = keyof typeof CATEGORIAS

export const OPCOES_CATEGORIA = Object.entries(CATEGORIAS).map(([valor, rotulo]) => ({
  valor,
  rotulo,
}))

export interface TipoAtendimento {
  id: number
  nome: string
  categoria: CategoriaAtendimento
  pontosBase: number
  ativo: boolean
  // Veio da carga inicial do sistema: aparece para todo médico e nenhum deles edita
  padrao: boolean
}
