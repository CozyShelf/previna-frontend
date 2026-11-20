import { useRef, useState } from 'react'

import { Button } from '@/components/common/Button'
import { Form } from '@/components/common/Form'
import { Icone } from '@/components/common/Icone'
import { InputGroup } from '@/components/common/InputGroup'
import { CATEGORIAS, type Categoria } from '@/components/produto/categorias'
import { PageHeader } from '@/components/sistema/PageHeader'
import { useEnvioUnico } from '@/hooks/useEnvioUnico'
import { ApiError, post } from '@/lib/api'
import { formatarData, formatarDataHora } from '@/lib/datas'
import { formatarPercentual } from '@/lib/mascaras'

// Cupom ou promoção resgatados pela gestante, como o backend devolve ao validar o código na loja
export interface ResgateValidado {
  id: number
  tipo: 'CUPOM' | 'PROMOCAO'
  codigo: string
  // Só na promoção
  titulo: string | null
  // Só no cupom
  produtoNome: string | null
  // Pode faltar no cupom de produto sem categoria
  categoria: Categoria | null
  // Percentual
  desconto: number
  // aaaa-mm-dd
  validade: string
  // Instantes ISO
  dataResgate: string
  dataUso: string
  gestanteNome: string
}

type Resultado =
  { tipo: 'sucesso'; resgate: ResgateValidado } | { tipo: 'erro'; codigo: string; mensagem: string }

// Mesmo formato do GeradorCodigoResgate do backend (maiúsculas, sem espaços). O leitor de código de barras ou QR
// "digita" o código e manda Enter, às vezes com espaço sobrando; quem digita pode usar minúsculas
const normalizar = (codigo: FormDataEntryValue | null) =>
  String(codigo ?? '')
    .trim()
    .toUpperCase()

// Decide pelo código do erro, nunca pelo texto da mensagem (D14)
function mensagemDeErro(erro: unknown) {
  if (erro instanceof ApiError) {
    switch (erro.codigo) {
      case 'RESGATE_NAO_ENCONTRADO':
        return 'Código não encontrado. Confira se foi digitado corretamente e se é de um cupom ou promoção da sua empresa.'
      case 'RESGATE_JA_UTILIZADO':
        return erro.detalhes.dataUso
          ? `Este código já foi utilizado em ${formatarDataHora(erro.detalhes.dataUso)}.`
          : 'Este código já foi utilizado.'
      case 'RESGATE_EXPIRADO':
        return 'Este código expirou e não pode mais ser usado.'
    }
  }
  return 'Não foi possível validar o código. Tente de novo.'
}

export function ValidarCupomPage() {
  const campo = useRef<HTMLInputElement>(null)
  const { enviando, enviar } = useEnvioUnico()
  const [erroCampo, setErroCampo] = useState<string>()
  const [resultado, setResultado] = useState<Resultado>()

  async function validar(dados: FormData) {
    await enviar(async () => {
      const codigo = normalizar(dados.get('codigo'))
      if (!codigo) {
        setErroCampo('Informe o código.')
        campo.current?.focus()
        return
      }
      // Limpa já no envio: o próximo código lido enquanto este é validado entra num campo vazio e não é apagado
      // na resposta. O resultado anterior sai para não ser confundido com o deste código
      setErroCampo(undefined)
      setResultado(undefined)
      if (campo.current) campo.current.value = ''
      try {
        const resgate = await post<ResgateValidado>('/empresas/cupons/validar', { codigo })
        setResultado({ tipo: 'sucesso', resgate })
      } catch (e) {
        setResultado({ tipo: 'erro', codigo, mensagem: mensagemDeErro(e) })
      } finally {
        // O clique no botão (desabilitado durante o envio) tira o foco do campo
        campo.current?.focus()
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Validar cupom"
        descricao="Na hora da compra, digite o código que a gestante mostra no app ou leia o QR code com o leitor. Vale para cupons e promoções, e cada código só pode ser usado uma vez."
      />

      <section className="rounded-lg border border-zinc-200 bg-white p-6">
        <Form onSubmit={validar} noValidate className="flex items-start gap-3">
          <InputGroup
            ref={campo}
            name="codigo"
            labelTxt="Código"
            placeholder="Ex.: ABCD2345"
            erro={erroCampo}
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            onChange={() => setErroCampo(undefined)}
            className="flex-1"
          />
          <Button
            label={enviando ? 'Validando…' : 'Validar'}
            style="primary"
            type="submit"
            disabled={enviando}
            icon={<Icone nome="validar" />}
            // Alinha com o campo, abaixo do rótulo
            className="mt-[26px]"
          />
        </Form>
      </section>

      {resultado?.tipo === 'sucesso' && <ResgateValidadoCard resgate={resultado.resgate} />}
      {resultado?.tipo === 'erro' && (
        <ErroValidacao codigo={resultado.codigo} mensagem={resultado.mensagem} />
      )}
    </div>
  )
}

function ResgateValidadoCard({ resgate }: { resgate: ResgateValidado }) {
  const promocao = resgate.tipo === 'PROMOCAO'
  const itens: [string, string][] = [
    ['Tipo', promocao ? 'Promoção' : 'Cupom'],
    promocao ? ['Título', resgate.titulo ?? '—'] : ['Produto', resgate.produtoNome ?? '—'],
    ...(resgate.categoria
      ? [['Categoria', CATEGORIAS[resgate.categoria]] as [string, string]]
      : []),
    ['Desconto', formatarPercentual(resgate.desconto)],
    ['Gestante', resgate.gestanteNome],
    ['Resgatado em', formatarDataHora(resgate.dataResgate)],
    ['Validade', formatarData(resgate.validade)],
  ]

  return (
    <section
      role="status"
      aria-label="Resultado da validação"
      className="flex flex-col gap-5 rounded-lg border-2 border-emerald-300 bg-emerald-50 p-6"
    >
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Icone nome="sucesso" className="size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold text-emerald-900">
            {promocao ? 'Promoção validada' : 'Cupom validado'}
          </p>
          <p className="text-sm text-emerald-800">
            Código <span className="font-mono font-semibold tracking-wider">{resgate.codigo}</span>
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 sm:grid-cols-3 gap-y-3 rounded-md bg-white p-4 ring-1 ring-emerald-200">
        {itens.map(([rotulo, valor]) => (
          <div key={rotulo} className="flex flex-col gap-0.5">
            <dt className="text-xs text-zinc-500">{rotulo}</dt>
            <dd className="font-medium text-zinc-900 tabular-nums">{valor}</dd>
          </div>
        ))}
      </dl>

      <p className="font-semibold text-emerald-900">
        Validado em {formatarDataHora(resgate.dataUso)}
      </p>
    </section>
  )
}

function ErroValidacao({ codigo, mensagem }: { codigo: string; mensagem: string }) {
  return (
    <section
      role="alert"
      aria-label="Resultado da validação"
      className="flex items-start gap-4 rounded-lg border-2 border-red-300 bg-red-50 p-6"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
        <Icone nome="alerta" className="size-6" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-red-900">Código não validado</p>
        <p className="text-red-800">{mensagem}</p>
        <p className="text-sm text-red-700">
          Código <span className="font-mono font-semibold tracking-wider">{codigo}</span>
        </p>
      </div>
    </section>
  )
}
