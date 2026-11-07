// Mesmos valores dos enums CategoriaConteudo e TipoConteudo no backend
export const CATEGORIAS = { DICA: 'Dica', NOTICIA: 'Notícia', AVISO: 'Aviso' }

export type CategoriaConteudo = keyof typeof CATEGORIAS

export const TIPOS = { TEXTO: 'Texto', FOTO: 'Foto', VIDEO: 'Vídeo', LINK: 'Link' }

export type TipoConteudo = keyof typeof TIPOS

const opcoes = (rotulos: Record<string, string>) =>
  Object.entries(rotulos).map(([valor, rotulo]) => ({ valor, rotulo }))

export const OPCOES_CATEGORIA = opcoes(CATEGORIAS)
export const OPCOES_TIPO = opcoes(TIPOS)

// O tipo decide qual campo é obrigatório: TEXTO vive do corpo, os demais da mídia
export const USA_MIDIA: Record<TipoConteudo, boolean> = {
  TEXTO: false,
  FOTO: true,
  VIDEO: true,
  LINK: true,
}

export interface Conteudo {
  id: number
  titulo: string
  categoria: CategoriaConteudo
  tipo: TipoConteudo
  resumo?: string
  corpo?: string
  midiaUrl?: string
  publicado: boolean
  criadoEm: string
  publicadoEm?: string
}
