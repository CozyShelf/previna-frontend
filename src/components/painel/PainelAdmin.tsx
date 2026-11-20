import { diasDesde } from '@/lib/datas'
import {
  Atalhos,
  CardLista,
  CardNumero,
  EstadoPainel,
  GradeListas,
  GradeNumeros,
  LinhaLista,
  type Atalho,
} from './blocos'
import {
  dataHoraOuNada,
  lerArray,
  lerLista,
  numero,
  type AtividadeDoPainel,
  type PainelAdminDados,
} from './dados'
import { usePainel } from './usePainel'

const ATALHOS: Atalho[] = [
  { para: '/medicos/novo', rotulo: 'Cadastrar médico', icone: 'adicionar' },
  { para: '/empresas/pre-cadastro', rotulo: 'Pré-cadastrar empresa', icone: 'empresas' },
  { para: '/conteudos/novo', rotulo: 'Novo conteúdo', icone: 'conteudo' },
]

// Valores de AcaoAuditoria no backend (log_auditoria, V24)
const TEXTO_ACAO: Record<string, string> = {
  AGENDAMENTO_CRIADO: 'Exame ou consulta agendado',
  AGENDAMENTO_REALIZADO: 'Exame ou consulta confirmado',
  AGENDAMENTO_NAO_COMPARECEU: 'Não comparecimento registrado',
  CUPOM_RESGATADO: 'Cupom resgatado',
  PROMOCAO_RESGATADA: 'Promoção resgatada',
  RESGATE_VALIDADO: 'Código validado',
}
// Ação nova no backend que a tela ainda não conhece
const ACAO_DESCONHECIDA = 'Atividade registrada'

const ROTULO_PERFIL: Record<string, string> = {
  MEDICO: 'Médico',
  GESTANTE: 'Gestante',
  EMPRESA_PARCEIRA: 'Empresa parceira',
  ADMIN: 'Administrador',
}

// Quem fez. A gestante nunca aparece pelo nome: o administrador não tem acesso a gestantes e o atendimento é
// dado de saúde (LGPD). Mesmo que a resposta traga o nome, a tela mostra só o perfil
function autorDaAtividade({ usuarioNome, perfil }: AtividadeDoPainel) {
  if (perfil === 'GESTANTE') return 'Gestante'
  const rotulo = ROTULO_PERFIL[perfil ?? '']
  if (!usuarioNome) return rotulo
  return rotulo ? `${usuarioNome} (${rotulo})` : usuarioNome
}

// Pontos sem o sinal do backend: o resgate de cupom é débito, o resto é crédito
function pontosDaAtividade({ acao, pontos }: AtividadeDoPainel) {
  if (typeof pontos !== 'number' || pontos === 0) return undefined
  const valor = Math.abs(pontos)
  return `${acao === 'CUPOM_RESGATADO' ? '−' : '+'}${valor} ${valor === 1 ? 'ponto' : 'pontos'}`
}

function preCadastradaHa(instante?: string) {
  if (!instante || Number.isNaN(Date.parse(instante))) return undefined
  const dias = diasDesde(instante)
  if (dias === 0) return 'pré-cadastrada hoje'
  return `pré-cadastrada há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
}

const noPrimeiroAcesso = (n?: number) => (n === undefined ? undefined : `${n} no primeiro acesso`)

// Painel do administrador: cadastros do sistema, empresas que ainda não entraram e a atividade recente do
// log de auditoria. Nenhum dado de gestante além das contagens
export function PainelAdmin() {
  const painel = usePainel<PainelAdminDados>('/painel/admin')

  return (
    <div className="flex flex-col gap-6">
      <Atalhos atalhos={ATALHOS} />

      <EstadoPainel estado={painel}>
        {(dados) => {
          const publicados = numero(dados.conteudos?.publicados)
          const rascunhos = numero(dados.conteudos?.rascunhos)
          return (
            <>
              <GradeNumeros>
                <CardNumero rotulo="Médicos" valor={numero(dados.medicos)} para="/medicos" />
                <CardNumero
                  rotulo="Empresas parceiras"
                  valor={numero(dados.empresas?.total)}
                  detalhe={noPrimeiroAcesso(numero(dados.empresas?.primeiroAcessoPendente))}
                  para="/empresas"
                />
                {/* Sem link: o administrador não abre a lista de gestantes */}
                <CardNumero
                  rotulo="Gestantes"
                  valor={numero(dados.gestantes?.total)}
                  detalhe={noPrimeiroAcesso(numero(dados.gestantes?.primeiroAcessoPendente))}
                />
                <CardNumero
                  rotulo="Conteúdos publicados"
                  valor={publicados}
                  detalhe={
                    rascunhos === undefined
                      ? undefined
                      : `${rascunhos} ${rascunhos === 1 ? 'rascunho' : 'rascunhos'}`
                  }
                  para="/conteudos"
                />
              </GradeNumeros>

              <GradeListas>
                <CardLista
                  titulo="Empresas aguardando o primeiro acesso"
                  lista={lerLista(dados.empresasPendentes)}
                  vazio="Todas as empresas já fizeram o primeiro acesso."
                  chave={(item, i) => item.empresaId ?? `sem-id-${i}`}
                  maisPara="/empresas"
                >
                  {(item) => {
                    const ha = preCadastradaHa(item.preCadastradaEm)
                    return (
                      <LinhaLista>
                        <span className="min-w-0 flex-1 font-medium text-zinc-900">
                          {item.razaoSocial}
                        </span>
                        {ha && <span className="text-sm text-zinc-500">{ha}</span>}
                      </LinhaLista>
                    )
                  }}
                </CardLista>

                <CardLista
                  titulo="Atividade recente"
                  lista={lerArray(dados.atividadeRecente)}
                  vazio="Nenhuma atividade registrada ainda."
                  chave={(item, i) => `${item.dataHora}-${i}`}
                >
                  {(item) => <LinhaAtividade atividade={item} />}
                </CardLista>
              </GradeListas>
            </>
          )
        }}
      </EstadoPainel>
    </div>
  )
}

function LinhaAtividade({ atividade }: { atividade: AtividadeDoPainel }) {
  const autor = autorDaAtividade(atividade)
  const quando = dataHoraOuNada(atividade.dataHora)
  const pontos = pontosDaAtividade(atividade)

  return (
    <div className="flex flex-col gap-0.5 px-6 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <span className="font-medium text-zinc-900">
          {TEXTO_ACAO[atividade.acao ?? ''] ?? ACAO_DESCONHECIDA}
        </span>
        {pontos && <span className="text-sm text-zinc-600 tabular-nums">{pontos}</span>}
      </div>
      <span className="text-sm text-zinc-500">{[autor, quando].filter(Boolean).join(' · ')}</span>
    </div>
  )
}
