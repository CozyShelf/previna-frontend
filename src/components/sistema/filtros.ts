import type { FiltroListagem } from './Listagem'

// Filtro das listas de gestantes e de empresas, com os mesmos rótulos do selo
export const FILTRO_SITUACAO: FiltroListagem = {
  nome: 'situacao',
  rotulo: 'Situação',
  opcoes: [
    { valor: '', rotulo: 'Todas as situações' },
    { valor: 'ATIVA', rotulo: 'Ativa' },
    { valor: 'PRIMEIRO_ACESSO_PENDENTE', rotulo: 'Aguardando primeiro acesso' },
  ],
}
