import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useValidacao, type Validacoes } from '@/hooks/useValidacao'
import { ApiError, get, post } from '@/lib/api'
import { hoje } from '@/lib/datas'
import BUTTON_CLASSES from '@/types/ButtonClasses'
import { Alerta } from '../common/Alerta'
import { Button } from '../common/Button'
import { Form } from '../common/Form'
import { InputGroup } from '../common/InputGroup'
import { SecaoFormulario } from '../common/SecaoFormulario'
import { SelectGroup } from '../common/SelectGroup'

interface TipoAtendimento {
  id: number
  nome: string
  categoria: 'EXAME' | 'CONSULTA'
  pontosBase: number
}

const OPCOES_CATEGORIA = [
  { valor: 'EXAME', rotulo: 'Exame' },
  { valor: 'CONSULTA', rotulo: 'Consulta' },
]

type Campo = 'tipoAtendimento' | 'dataPrevista'

// Mesmas regras do AgendamentoRequest no backend; a observação é opcional
const VALIDACOES: Validacoes<Campo> = {
  tipoAtendimento: (valor) => (valor ? undefined : 'Escolha o exame ou a consulta.'),
  dataPrevista: (valor) => {
    if (!valor) return 'Informe a data prevista.'
    if (valor < hoje()) return 'A data não pode ser no passado.'
  },
}

export function FormAgendamento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tipos, setTipos] = useState<TipoAtendimento[]>()
  const [erroCarga, setErroCarga] = useState(false)
  const [categoria, setCategoria] = useState('')
  const [erro, setErro] = useState<string>()
  const [enviando, setEnviando] = useState(false)
  const { campo, validarTodos } = useValidacao(VALIDACOES)

  useEffect(() => {
    get<TipoAtendimento[]>('/tipos-atendimento')
      .then(setTipos)
      .catch(() => setErroCarga(true))
  }, [])

  // A categoria só filtra a lista; o que vai para a API é o tipo escolhido
  const disponiveis = (tipos ?? []).filter((tipo) => !categoria || tipo.categoria === categoria)

  async function salvar(dados: FormData) {
    if (!validarTodos(dados)) return

    setErro(undefined)
    setEnviando(true)
    try {
      const observacao = String(dados.get('observacao') ?? '').trim()
      const escolhido = tipos?.find((tipo) => String(tipo.id) === dados.get('tipoAtendimento'))
      const criado = await post<{ tipo: string }>('/agendamentos', {
        gestante: Number(id),
        tipoAtendimento: Number(dados.get('tipoAtendimento')),
        dataPrevista: dados.get('dataPrevista'),
        // Em branco não vai, para ficar nulo no banco em vez de texto vazio
        ...(observacao && { observacao }),
      })
      navigate(`/gestantes/${id}`, {
        // "Cadastro de X realizado" concorda com qualquer tipo; "X cadastrado" erraria o gênero de "Consulta"
        state: { mensagem: `Cadastro de ${criado.tipo ?? escolhido?.nome} realizado com sucesso.` },
      })
    } catch (e) {
      setErro(mensagemDeErro(e))
      setEnviando(false)
    }
  }

  if (erroCarga) {
    return (
      <Alerta mensagem="Não foi possível carregar os tipos de exame e consulta. Recarregue a página para tentar de novo." />
    )
  }

  return (
    <Form
      onSubmit={salvar}
      noValidate
      className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white"
    >
      <SecaoFormulario
        titulo="Exame ou consulta"
        descricao="A gestante vê o que foi marcado no app. Os pontos do tipo escolhido só são creditados quando você confirmar a realização."
      >
        <SelectGroup
          labelTxt="Categoria"
          name="categoria"
          opcoes={OPCOES_CATEGORIA}
          vazio="Exames e consultas"
          value={categoria}
          onChange={(e) => setCategoria(e.currentTarget.value)}
          hint="Filtra a lista ao lado"
        />
        <SelectGroup
          labelTxt="Exame ou consulta"
          {...campo('tipoAtendimento')}
          opcoes={disponiveis.map((tipo) => ({
            valor: String(tipo.id),
            rotulo: `${tipo.nome} (${tipo.pontosBase} pontos)`,
          }))}
          vazio="Escolha o exame ou a consulta"
          required
        />
        <InputGroup
          labelTxt="Data prevista"
          {...campo('dataPrevista')}
          type="date"
          min={hoje()}
          required
        />
        <InputGroup
          labelTxt="Observação"
          name="observacao"
          hint="Opcional"
          maxLength={1000}
          placeholder="Ex.: jejum de 8h"
        />
      </SecaoFormulario>

      <div className="flex items-center justify-end gap-3 rounded-b-lg bg-zinc-50 px-6 py-4">
        {erro && (
          <div className="mr-auto">
            <Alerta mensagem={erro} />
          </div>
        )}
        <Link to={`/gestantes/${id}`} className={BUTTON_CLASSES.secondary}>
          Cancelar
        </Link>
        <Button
          label={enviando ? 'Salvando…' : 'Cadastrar'}
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
    return 'O servidor não aceitou os dados. Confira os campos e tente novamente.'
  if (erro instanceof ApiError && erro.status === 404)
    return 'Gestante não encontrada. Volte à lista e abra a gestante de novo.'
  return 'Não foi possível salvar. Verifique sua conexão e tente novamente.'
}
