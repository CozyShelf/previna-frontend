import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useValidacao, type Validacoes } from '@/hooks/useValidacao'
import { ApiError, post } from '@/lib/api'
import { hoje } from '@/lib/datas'
import { decimalDaApi } from '@/lib/mascaras'
import { erroDesconto } from '@/lib/validacoes'
import BUTTON_CLASSES from '@/types/ButtonClasses'
import { Alerta } from '../common/Alerta'
import { Button } from '../common/Button'
import { Form } from '../common/Form'
import { InputGroup } from '../common/InputGroup'
import { SecaoFormulario } from '../common/SecaoFormulario'
import { SelectGroup } from '../common/SelectGroup'
import { OPCOES_CATEGORIA, type Categoria } from '../produto/categorias'

export interface Promocao {
  id: number
  titulo: string
  descricao?: string
  // Percentual
  desconto: number
  dataInicio: string
  dataFim: string
  // Vale para todos os produtos da empresa nesta categoria
  categoria: Categoria
}

type Campo = 'titulo' | 'desconto' | 'dataInicio' | 'dataFim' | 'categoria'

// Mesmas regras do PromocaoRequest no backend
const VALIDACOES: Validacoes<Campo> = {
  titulo: (valor) => (valor.trim() ? undefined : 'Informe o título da promoção.'),
  desconto: erroDesconto,
  dataInicio: (valor) => (valor ? undefined : 'Informe a data de início.'),
  dataFim: (valor, dados) => {
    if (!valor) return 'Informe a data de fim.'
    if (valor < String(dados.get('dataInicio')))
      return 'O fim deve ser no mesmo dia do início ou depois.'
    if (valor < hoje()) return 'A data de fim já passou.'
  },
  categoria: (valor) => (valor ? undefined : 'Escolha a categoria.'),
}

export function FormPromocao() {
  const navigate = useNavigate()
  const [erro, setErro] = useState<string>()
  const [enviando, setEnviando] = useState(false)
  const { campo, validarTodos } = useValidacao(VALIDACOES)

  async function salvar(dados: FormData) {
    if (!validarTodos(dados)) return

    setErro(undefined)
    setEnviando(true)
    try {
      const corpo = {
        titulo: dados.get('titulo'),
        descricao: dados.get('descricao') || undefined,
        desconto: Number(decimalDaApi(dados.get('desconto'))),
        dataInicio: dados.get('dataInicio'),
        dataFim: dados.get('dataFim'),
        categoria: dados.get('categoria'),
      }
      await post('/empresas/promocoes', corpo)
      navigate('/promocoes', {
        state: { mensagem: `Promoção ${corpo.titulo} cadastrada com sucesso.` },
      })
    } catch (e) {
      setErro(mensagemDeErro(e))
      setEnviando(false)
    }
  }

  return (
    <Form
      onSubmit={salvar}
      noValidate
      className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white"
    >
      <SecaoFormulario titulo="Promoção" descricao="O que as gestantes veem sobre a promoção.">
        <InputGroup
          labelTxt="Título"
          {...campo('titulo')}
          maxLength={150}
          required
          autoFocus
          className="col-span-2"
        />
        <InputGroup
          labelTxt="Descrição"
          name="descricao"
          hint="Opcional"
          maxLength={1000}
          className="col-span-2"
        />
        <InputGroup
          labelTxt="Desconto (%)"
          {...campo('desconto')}
          placeholder="Ex.: 15"
          inputMode="decimal"
          maxLength={6}
          required
        />
        <SelectGroup
          labelTxt="Categoria"
          {...campo('categoria')}
          opcoes={OPCOES_CATEGORIA}
          vazio="Escolha…"
          required
        />
      </SecaoFormulario>

      <SecaoFormulario
        titulo="Vigência"
        descricao="A promoção vale do início ao fim, incluindo os dois dias."
      >
        <InputGroup labelTxt="Início" {...campo('dataInicio')} type="date" required />
        <InputGroup labelTxt="Fim" {...campo('dataFim')} type="date" min={hoje()} required />
      </SecaoFormulario>

      <div className="flex items-center justify-end gap-3 rounded-b-lg bg-zinc-50 px-6 py-4">
        {erro && (
          <div className="mr-auto">
            <Alerta mensagem={erro} />
          </div>
        )}
        <Link to="/promocoes" className={BUTTON_CLASSES.secondary}>
          Cancelar
        </Link>
        <Button
          label={enviando ? 'Salvando…' : 'Cadastrar promoção'}
          style="primary"
          type="submit"
          disabled={enviando}
        />
      </div>
    </Form>
  )
}

function mensagemDeErro(erro: unknown) {
  if (erro instanceof ApiError && erro.status === 400)
    return 'O servidor não aceitou os dados. Confira o período e a categoria e tente novamente.'
  return 'Não foi possível salvar. Verifique sua conexão e tente novamente.'
}
