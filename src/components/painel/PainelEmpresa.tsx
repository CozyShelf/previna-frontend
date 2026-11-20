import { Link } from 'react-router-dom'

import { Icone } from '@/components/common/Icone'
import { BOTAO_PRIMARIO_GRANDE } from '@/types/ButtonClasses'
import {
  CardLista,
  CardNumero,
  EstadoPainel,
  GradeListas,
  GradeNumeros,
  LinhaLista,
  Selo,
} from './blocos'
import {
  dataHoraOuNada,
  dataOuNada,
  destino,
  lerArray,
  lerLista,
  numero,
  type PainelEmpresaDados,
} from './dados'
import { usePainel } from './usePainel'

const TIPO_RESGATE: Record<string, string> = { CUPOM: 'Cupom', PROMOCAO: 'Promoção' }

// Painel da empresa parceira: validar o código na loja vem primeiro; depois os números das ofertas e o que
// precisa de atenção (cupom vencendo, produto sem oferta)
export function PainelEmpresa() {
  const painel = usePainel<PainelEmpresaDados>('/painel/empresa')

  return (
    <div className="flex flex-col gap-6">
      <Link to="/validar-cupom" className={`${BOTAO_PRIMARIO_GRANDE} self-start`}>
        <Icone nome="validar" className="size-5" />
        Validar cupom
      </Link>

      <EstadoPainel estado={painel}>
        {(dados) => {
          const validacoes = lerArray(dados.ultimasValidacoes)
          return (
            <>
              <GradeNumeros>
                <CardNumero
                  rotulo="Cupons ativos"
                  valor={numero(dados.cuponsAtivos)}
                  para="/cupons"
                />
                <CardNumero
                  rotulo="Promoções vigentes"
                  valor={numero(dados.promocoesVigentes)}
                  para="/promocoes"
                />
                <CardNumero
                  rotulo="Resgates aguardando uso"
                  valor={numero(dados.resgatesAguardandoUso)}
                  detalhe="Códigos que as gestantes ainda vão usar na loja"
                />
                <CardNumero
                  rotulo="Validações nos últimos 30 dias"
                  valor={numero(dados.validacoes30Dias)}
                />
              </GradeNumeros>

              <GradeListas>
                <CardLista
                  titulo="Cupons que vencem em 7 dias"
                  lista={lerLista(dados.cuponsVencendo7Dias)}
                  vazio="Nenhum cupom vence nos próximos 7 dias."
                  chave={(item, i) => item.cupomId ?? `sem-id-${i}`}
                  maisPara="/cupons"
                >
                  {(item) => {
                    const validade = dataOuNada(item.dataValidade)
                    return (
                      <LinhaLista para={destino('/cupons', item.cupomId)}>
                        <span className="min-w-0 flex-1 font-medium text-zinc-900">
                          {item.produtoNome}
                        </span>
                        {validade && (
                          <span className="text-sm text-zinc-500 tabular-nums">
                            vence em {validade}
                          </span>
                        )}
                      </LinhaLista>
                    )
                  }}
                </CardLista>

                <CardLista
                  titulo="Produtos sem oferta"
                  lista={lerLista(dados.produtosSemOferta)}
                  vazio="Todos os produtos têm um cupom ou uma promoção valendo."
                  chave={(item, i) => item.produtoId ?? `sem-id-${i}`}
                  maisPara="/produtos"
                  rodape={
                    lerLista(dados.produtosSemOferta).total > 0 && (
                      <>
                        Produto sem cupom nem promoção não aparece para as gestantes no app.{' '}
                        <Link
                          to="/cupons/novo"
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          Criar cupom
                        </Link>
                      </>
                    )
                  }
                >
                  {(item) => (
                    <LinhaLista para={destino('/produtos', item.produtoId)}>
                      <span className="min-w-0 flex-1 font-medium text-zinc-900">{item.nome}</span>
                    </LinhaLista>
                  )}
                </CardLista>
              </GradeListas>

              <CardLista
                titulo="Últimas validações"
                lista={validacoes}
                vazio="Nenhum código validado ainda. As validações feitas na loja aparecem aqui."
                chave={(item, i) => item.resgateId ?? `sem-id-${i}`}
              >
                {(item) => {
                  const tipo = TIPO_RESGATE[item.tipo ?? '']
                  const quando = dataHoraOuNada(item.dataUso)
                  return (
                    <LinhaLista>
                      <span className="font-mono text-sm font-medium text-zinc-900">
                        {item.codigo}
                      </span>
                      <span className="min-w-0 flex-1 text-sm text-zinc-700">
                        {item.produtoNome ?? item.titulo}
                      </span>
                      {tipo && <Selo>{tipo}</Selo>}
                      {quando && (
                        <span className="text-sm text-zinc-500 tabular-nums">{quando}</span>
                      )}
                    </LinhaLista>
                  )
                }}
              </CardLista>
            </>
          )
        }}
      </EstadoPainel>
    </div>
  )
}
