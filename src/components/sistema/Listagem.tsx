import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Alerta } from '@/components/common/Alerta'
import { Button } from '@/components/common/Button'
import { Icone } from '@/components/common/Icone'
import { get, type Pagina } from '@/lib/api'

const ESPERA_BUSCA_MS = 300

export interface FiltroListagem {
  // Parâmetro da API
  nome: string
  rotulo: string
  // A primeira opção, de valor vazio, é a sem filtro
  opcoes: { valor: string; rotulo: string }[]
}

export interface ListagemProps<T> {
  caminho: string
  descricaoBusca: string
  filtros: FiltroListagem[]
  // Exibido quando ainda não há nada cadastrado (sem busca nem filtro)
  vazio: ReactNode
  children: (itens: T[]) => ReactNode
}

const CLASSES_CAMPO =
  'h-9 rounded-md border border-zinc-300 bg-white text-sm text-zinc-900 focus:border-previna-600 focus:ring-3 focus:ring-previna-600/15 focus:outline-none'

// Busca, filtros e página ficam na URL: recarregar a página mantém a consulta
export function Listagem<T>({
  caminho,
  descricaoBusca,
  filtros,
  vazio,
  children,
}: ListagemProps<T>) {
  const [params, setParams] = useSearchParams()
  const consulta = params.toString()
  const [resultado, setResultado] = useState<{ consulta: string; pagina?: Pagina<T> }>()
  const [busca, setBusca] = useState(params.get('busca') ?? '')
  const espera = useRef<number>(undefined)

  useEffect(() => {
    let vigente = true
    get<Pagina<T>>(consulta ? `${caminho}?${consulta}` : caminho)
      .then((pagina) => vigente && setResultado({ consulta, pagina }))
      .catch(() => vigente && setResultado({ consulta }))
    return () => {
      vigente = false
    }
  }, [caminho, consulta])

  // Busca pendente não pode alterar a URL depois de sair da página
  useEffect(() => () => clearTimeout(espera.current), [])

  function alterar(nome: string, valor: string) {
    setParams(
      (atuais) => {
        const novos = new URLSearchParams(atuais)
        if (valor) novos.set(nome, valor)
        else novos.delete(nome)
        // Busca ou filtro novo recomeça da primeira página
        if (nome !== 'pagina') novos.delete('pagina')
        return novos
      },
      { replace: true },
    )
  }

  function buscar(texto: string) {
    setBusca(texto)
    clearTimeout(espera.current)
    espera.current = window.setTimeout(() => alterar('busca', texto.trim()), ESPERA_BUSCA_MS)
  }

  function limpar() {
    clearTimeout(espera.current)
    setBusca('')
    setParams({}, { replace: true })
  }

  // Enquanto a consulta nova carrega, a lista anterior continua na tela
  const carregando = resultado?.consulta !== consulta
  const pagina = resultado?.pagina
  const filtrando = [...params.keys()].some((nome) => nome !== 'pagina')

  return (
    <div className="flex flex-col gap-4">
      <div role="search" className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <Icone
            nome="buscar"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="search"
            aria-label="Buscar"
            placeholder={descricaoBusca}
            value={busca}
            maxLength={100}
            onChange={(e) => buscar(e.currentTarget.value)}
            className={`${CLASSES_CAMPO} w-full pr-3 pl-9 placeholder:text-zinc-400`}
          />
        </div>
        {filtros.map((filtro) => (
          <select
            key={filtro.nome}
            aria-label={filtro.rotulo}
            value={params.get(filtro.nome) ?? ''}
            onChange={(e) => alterar(filtro.nome, e.currentTarget.value)}
            className={`${CLASSES_CAMPO} px-3`}
          >
            {filtro.opcoes.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
        ))}
      </div>

      {!resultado && <p className="text-zinc-500">Carregando…</p>}
      {resultado && !carregando && !pagina && (
        <Alerta mensagem="Não foi possível carregar a lista. Recarregue a página para tentar de novo." />
      )}
      {pagina?.total === 0 && !filtrando && vazio}
      {pagina && pagina.itens.length === 0 && (filtrando || pagina.total > 0) && (
        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <p className="mr-auto text-zinc-600">
            Nenhum resultado para a busca e os filtros escolhidos.
          </p>
          <Button label="Limpar busca e filtros" style="secondary" onClick={limpar} />
        </div>
      )}
      {pagina && pagina.itens.length > 0 && (
        <div aria-busy={carregando} className={carregando ? 'opacity-60' : undefined}>
          {children(pagina.itens)}
          <Paginacao
            pagina={pagina}
            onIrPara={(numero) => alterar('pagina', numero ? String(numero) : '')}
          />
        </div>
      )}
    </div>
  )
}

interface PaginacaoProps {
  pagina: Pagina<unknown>
  onIrPara: (pagina: number) => void
}

function Paginacao({ pagina, onIrPara }: PaginacaoProps) {
  const inicio = pagina.pagina * pagina.tamanho + 1
  const fim = inicio + pagina.itens.length - 1

  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-between gap-4 pt-4 text-sm text-zinc-600"
    >
      <p className="tabular-nums">
        {inicio}–{fim} de {pagina.total}
      </p>
      {pagina.totalPaginas > 1 && (
        <div className="flex items-center gap-3">
          <Button
            label="Anterior"
            style="secondary"
            disabled={pagina.pagina === 0}
            onClick={() => onIrPara(pagina.pagina - 1)}
          />
          <span className="tabular-nums">
            Página {pagina.pagina + 1} de {pagina.totalPaginas}
          </span>
          <Button
            label="Próxima"
            style="secondary"
            disabled={pagina.pagina + 1 >= pagina.totalPaginas}
            onClick={() => onIrPara(pagina.pagina + 1)}
          />
        </div>
      )}
    </nav>
  )
}
