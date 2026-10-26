// Mesmos valores do enum Categoria no backend; a promoção vale para todos os produtos de uma categoria
export const CATEGORIAS = { FRALDAS: 'Fraldas', ROUPAS: 'Roupas', REMEDIOS: 'Remédios' }

export type Categoria = keyof typeof CATEGORIAS

export const OPCOES_CATEGORIA = Object.entries(CATEGORIAS).map(([valor, rotulo]) => ({
  valor,
  rotulo,
}))
