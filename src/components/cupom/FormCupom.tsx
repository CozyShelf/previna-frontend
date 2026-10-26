import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useValidacao, type PropsCampo, type Validacoes } from '@/hooks/useValidacao'
import { ApiError, get, post, type Pagina } from '@/lib/api'
import { hoje } from '@/lib/datas'
import { decimalDaApi, formatarPreco } from '@/lib/mascaras'
import { erroDesconto } from '@/lib/validacoes'
import BUTTON_CLASSES from '@/types/ButtonClasses'
import { Alerta } from '../common/Alerta'
import { Button } from '../common/Button'
import { Form } from '../common/Form'
import { Icone } from '../common/Icone'
import { InputGroup } from '../common/InputGroup'
import { SecaoFormulario } from '../common/SecaoFormulario'
import { SelectGroup } from '../common/SelectGroup'
import type { Produto } from '../produto/FormProduto'

export interface Cupom {
  id: number
  // Montada pelo backend a partir do desconto e do nome do produto
  descricao: string
  // Nome do produto
  produto: string
  // Percentual
  desconto: number
  dataValidade: string
  pontosNecessarios: number
  ativo: boolean
}

type Campo = 'produto' | 'desconto' | 'dataValidade' | 'pontosNecessarios'

// Mesmas regras do CupomRequest no backend
const VALIDACOES: Validacoes<Campo> = {
  produto: (valor) => (valor ? undefined : 'Escolha o produto.'),
  desconto: erroDesconto,
  dataValidade: (valor) => {
    if (!valor) return 'Informe a validade.'
    if (valor < hoje()) return 'A validade já passou.'
  },
  pontosNecessarios: (valor) => {
    if (!valor.trim()) return 'Informe os pontos necessários.'
    if (!/^\d+$/.test(valor.trim()) || Number(valor) < 1)
      return 'Informe um número inteiro maior que zero.'
  },
}

export function FormCupom() {
  const navigate = useNavigate()
  const [produtos, setProdutos] = useState<Produto[]>()
  const [erroCarga, setErroCarga] = useState(false)
  const [erro, setErro] = useState<string>()
  const [enviando, setEnviando] = useState(false)
  const { campo, validarTodos } = useValidacao(VALIDACOES)

  useEffect(() => {
    // shortcut: a escolha mostra só os 100 primeiros produtos (máximo por página da API); trocar por busca quando as empresas tiverem mais
    get<Pagina<Produto>>('/empresas/produtos?tamanho=100')
      .then((pagina) => setProdutos(pagina.itens))
      .catch(() => setErroCarga(true))
  }, [])

  async function salvar(dados: FormData) {
    if (!validarTodos(dados)) return

    setErro(undefined)
    setEnviando(true)
    try {
      const corpo = {
        produto: Number(dados.get('produto')),
        desconto: Number(decimalDaApi(dados.get('desconto'))),
        dataValidade: dados.get('dataValidade'),
        pontosNecessarios: Number(dados.get('pontosNecessarios')),
      }
      const cupom = await post<Cupom>('/empresas/cupons', corpo)
      navigate('/cupons', {
        state: { mensagem: `Cupom “${cupom.descricao}” cadastrado com sucesso.` },
      })
    } catch (e) {
      setErro(mensagemDeErro(e))
      setEnviando(false)
    }
  }

  if (erroCarga) {
    return (
      <Alerta mensagem="Não foi possível carregar os produtos. Recarregue a página para tentar de novo." />
    )
  }
  if (!produtos) return <p className="text-zinc-500">Carregando produtos…</p>
  if (!produtos.length) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-6 py-5">
        <p className="mr-auto text-zinc-600">
          O cupom vale para um produto da empresa. Cadastre o produto, com nome, foto e informações
          básicas, antes de criar o cupom.
        </p>
        <LinkCadastrarProduto />
      </div>
    )
  }

  return (
    <Form
      onSubmit={salvar}
      noValidate
      className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white"
    >
      <SecaoFormulario
        titulo="Produto"
        descricao="O cupom vale só para este produto. Para dar desconto em uma categoria inteira, crie uma promoção."
      >
        <EscolhaProduto produtos={produtos} campo={campo('produto')} />
      </SecaoFormulario>

      <SecaoFormulario
        titulo="Cupom"
        descricao="A descrição que as gestantes veem é montada sozinha, com o desconto e o produto: “10% de desconto em Fralda RN”."
      >
        <InputGroup
          labelTxt="Desconto (%)"
          {...campo('desconto')}
          placeholder="Ex.: 15"
          inputMode="decimal"
          maxLength={6}
          required
        />
        <InputGroup
          labelTxt="Validade"
          {...campo('dataValidade')}
          type="date"
          min={hoje()}
          required
        />
        <InputGroup
          labelTxt="Pontos para resgatar"
          {...campo('pontosNecessarios')}
          inputMode="numeric"
          maxLength={6}
          required
        />
      </SecaoFormulario>

      <div className="flex items-center justify-end gap-3 rounded-b-lg bg-zinc-50 px-6 py-4">
        {erro && (
          <div className="mr-auto">
            <Alerta mensagem={erro} />
          </div>
        )}
        <Link to="/cupons" className={BUTTON_CLASSES.secondary}>
          Cancelar
        </Link>
        <Button
          label={enviando ? 'Salvando…' : 'Cadastrar cupom'}
          style="primary"
          type="submit"
          disabled={enviando}
        />
      </div>
    </Form>
  )
}

function LinkCadastrarProduto() {
  return (
    <Link to="/produtos/novo" className={BUTTON_CLASSES.secondary}>
      <Icone nome="adicionar" />
      Cadastrar produto
    </Link>
  )
}

// O cupom usa os produtos já cadastrados (nome, foto e dados básicos vêm do cadastro de produto)
function EscolhaProduto({ produtos, campo }: { produtos: Produto[]; campo: PropsCampo }) {
  return (
    <>
      <SelectGroup
        labelTxt="Produto"
        {...campo}
        opcoes={produtos.map((produto) => ({
          valor: String(produto.id),
          rotulo:
            produto.preco === undefined
              ? produto.nome
              : `${produto.nome} (${formatarPreco(produto.preco)})`,
        }))}
        vazio="Escolha…"
        required
        autoFocus
        className="col-span-2"
      />
      <div className="col-span-2 flex items-center gap-3">
        <p className="mr-auto text-[13px] text-zinc-500">O produto não está na lista?</p>
        <LinkCadastrarProduto />
      </div>
    </>
  )
}

function mensagemDeErro(erro: unknown) {
  if (erro instanceof ApiError && erro.status === 400)
    return 'O servidor não aceitou os dados. Confira a validade e o produto e tente novamente.'
  return 'Não foi possível salvar. Verifique sua conexão e tente novamente.'
}
