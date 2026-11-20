import type { NomeIcone } from '@/components/common/Icone'

export interface ItemMenu {
  to: string
  label: string
  icone: NomeIcone
}

const INICIO: ItemMenu = { to: '/', label: 'Início', icone: 'inicio' }

// Itens do menu lateral por perfil. O teste das rotas confere que cada perfil abre tudo o que o
// próprio menu mostra
export const ITENS_MENU: Record<string, ItemMenu[]> = {
  MEDICO: [
    INICIO,
    { to: '/gestantes', label: 'Gestantes', icone: 'gestantes' },
    { to: '/tipos-atendimento', label: 'Tipos de atendimento', icone: 'validar' },
  ],
  ADMIN: [
    INICIO,
    { to: '/medicos', label: 'Médicos', icone: 'medicos' },
    { to: '/empresas', label: 'Empresas parceiras', icone: 'empresas' },
    { to: '/conteudos', label: 'Conteúdo educativo', icone: 'conteudo' },
  ],
  EMPRESA_PARCEIRA: [
    INICIO,
    { to: '/produtos', label: 'Produtos', icone: 'produto' },
    { to: '/promocoes', label: 'Promoções', icone: 'promocao' },
    { to: '/cupons', label: 'Cupons', icone: 'cupom' },
    { to: '/validar-cupom', label: 'Validar cupom', icone: 'validar' },
  ],
}
