import { useId, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Alerta } from '@/components/common/Alerta'
import { Button } from '@/components/common/Button'
import { Icone, type NomeIcone } from '@/components/common/Icone'
import BUTTON_CLASSES from '@/types/ButtonClasses'
import type { Lista } from './dados'
import type { EstadoDoPainel } from './usePainel'

interface EstadoPainelProps<T> {
  estado: EstadoDoPainel<T>
  children: (dados: T) => ReactNode
}

// Carregando, erro com "Tentar de novo" ou o conteúdo. Só troca o próprio painel: a saudação e a agenda do
// dia ficam fora dele
export function EstadoPainel<T>({ estado, children }: EstadoPainelProps<T>) {
  if (estado.erro) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-zinc-200 bg-white px-6 py-5">
        <Alerta mensagem="Não foi possível carregar o painel." />
        <Button label="Tentar de novo" style="secondary" onClick={estado.tentarDeNovo} />
      </div>
    )
  }
  if (!estado.dados) return <p className="text-zinc-500">Carregando painel…</p>
  return <>{children(estado.dados)}</>
}

export interface Atalho {
  para: string
  rotulo: string
  icone: NomeIcone
}

// Botões para as ações mais comuns do perfil; o primeiro é o principal
export function Atalhos({ atalhos }: { atalhos: Atalho[] }) {
  return (
    <nav aria-label="Atalhos" className="flex flex-wrap gap-3">
      {atalhos.map((atalho, i) => (
        <Link
          key={atalho.para}
          to={atalho.para}
          className={i === 0 ? BUTTON_CLASSES.primary : BUTTON_CLASSES.secondary}
        >
          <Icone nome={atalho.icone} />
          {atalho.rotulo}
        </Link>
      ))}
    </nav>
  )
}

// Grade dos números: uma coluna no celular, duas em telas médias e quatro nas largas
export function GradeNumeros({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
}

// Grade das listas: lado a lado só quando há espaço
export function GradeListas({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">{children}</div>
}

interface CardNumeroProps {
  rotulo: string
  // Ausente na resposta: mostra um traço em vez de um zero que não é verdade
  valor?: number
  detalhe?: string
  para?: string
}

export function CardNumero({ rotulo, valor, detalhe, para }: CardNumeroProps) {
  // Os espaços entre os spans somem no flex, mas separam as palavras no nome do link para o leitor de tela
  const conteudo = (
    <>
      <span className="text-sm text-zinc-600">{rotulo}</span>{' '}
      <span className="text-2xl font-semibold text-zinc-900 tabular-nums">{valor ?? '—'}</span>{' '}
      {detalhe && <span className="text-sm text-zinc-500">{detalhe}</span>}
    </>
  )
  const classes = 'flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white px-5 py-4'

  return para ? (
    <Link
      to={para}
      className={`${classes} transition-colors hover:border-zinc-300 hover:bg-zinc-50`}
    >
      {conteudo}
    </Link>
  ) : (
    <div className={classes}>{conteudo}</div>
  )
}

interface CardListaProps<T> {
  titulo: string
  lista: Lista<T>
  // Frase positiva para a lista vazia
  vazio: string
  chave: (item: T, indice: number) => string | number
  children: (item: T) => ReactNode
  // Para onde leva o "e mais N"; sem ele, é só texto
  maisPara?: string
  // Alerta: borda e cabeçalho em vermelho, usado só quando há itens
  alerta?: boolean
  rodape?: ReactNode
}

export function CardLista<T>({
  titulo,
  lista,
  vazio,
  chave,
  children,
  maisPara,
  alerta = false,
  rodape,
}: CardListaProps<T>) {
  const id = useId()
  const restantes = lista.total - lista.itens.length
  const destaque = alerta && lista.total > 0

  return (
    <section
      aria-labelledby={id}
      className={`overflow-hidden rounded-lg border bg-white ${destaque ? 'border-red-200' : 'border-zinc-200'}`}
    >
      <div
        className={`flex items-center gap-2 border-b px-6 py-3 ${destaque ? 'border-red-200 bg-red-50 text-red-800' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`}
      >
        {destaque && <Icone nome="alerta" className="size-4 shrink-0" />}
        <h2 id={id} className="font-semibold">
          {titulo}
        </h2>
        {lista.total > 0 && (
          <span className={`text-sm tabular-nums ${destaque ? 'text-red-700' : 'text-zinc-500'}`}>
            ({lista.total})
          </span>
        )}
      </div>

      {lista.itens.length === 0 ? (
        <p className="px-6 py-5 text-zinc-600">{vazio}</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {lista.itens.map((item, i) => (
            <li key={chave(item, i)}>{children(item)}</li>
          ))}
        </ul>
      )}

      {restantes > 0 && (
        <p className="border-t border-zinc-100 px-6 py-2.5 text-sm text-zinc-600">
          {maisPara ? (
            <Link to={maisPara} className="font-medium text-blue-600 hover:text-blue-700">
              e mais {restantes}
            </Link>
          ) : (
            `e mais ${restantes}`
          )}
        </p>
      )}
      {rodape && (
        <div className="border-t border-zinc-100 bg-zinc-50/60 px-6 py-3 text-sm text-zinc-600">
          {rodape}
        </div>
      )}
    </section>
  )
}

// Linha de lista: com destino vira link (a linha inteira é clicável), sem destino é só o conteúdo
export function LinhaLista({ para, children }: { para?: string; children: ReactNode }) {
  const classes = 'flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-3'
  return para ? (
    <Link to={para} className={`${classes} hover:bg-zinc-50`}>
      {children}
    </Link>
  ) : (
    <div className={classes}>{children}</div>
  )
}

export function Selo({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{children}</span>
  )
}
