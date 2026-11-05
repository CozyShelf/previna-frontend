import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useValidacao, type Validacoes } from '@/hooks/useValidacao'
import { ApiError, post, put } from '@/lib/api'
import BUTTON_CLASSES from '@/types/ButtonClasses'
import { Alerta } from '../common/Alerta'
import { Button } from '../common/Button'
import { Form } from '../common/Form'
import { InputGroup } from '../common/InputGroup'
import { SecaoFormulario } from '../common/SecaoFormulario'
import { SelectGroup } from '../common/SelectGroup'
import { OPCOES_CATEGORIA, type TipoAtendimento } from './categorias'

type Campo = 'nome' | 'categoria' | 'pontosBase'

// Mesmas regras do TipoAtendimentoRequest no backend
const VALIDACOES: Validacoes<Campo> = {
  nome: (valor) => (valor.trim() ? undefined : 'Informe o nome do tipo.'),
  categoria: (valor) => (valor ? undefined : 'Escolha se é exame ou consulta.'),
  pontosBase: (valor) => {
    const pontos = Number(valor)
    if (!valor.trim()) return 'Informe a pontuação.'
    if (!Number.isInteger(pontos) || pontos < 1 || pontos > 1000)
      return 'Informe um número inteiro de 1 a 1000.'
  },
}

export interface FormTipoAtendimentoProps {
  // Presente na edição
  tipo?: TipoAtendimento
}

// Excluir não fica aqui: é uma ação da linha na listagem
export function FormTipoAtendimento({ tipo }: FormTipoAtendimentoProps) {
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
        nome: String(dados.get('nome')).trim(),
        categoria: dados.get('categoria'),
        pontosBase: Number(dados.get('pontosBase')),
      }
      if (tipo) await put(`/tipos-atendimento/${tipo.id}`, corpo)
      else await post('/tipos-atendimento', corpo)
      navigate('/tipos-atendimento', {
        state: {
          mensagem: `Tipo ${corpo.nome} ${tipo ? 'atualizado' : 'cadastrado'} com sucesso.`,
        },
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
      <SecaoFormulario
        titulo="Tipo de exame ou consulta"
        descricao="Entra na lista que você escolhe ao marcar um exame ou consulta para a gestante. A pontuação é creditada a ela quando você confirmar a realização."
      >
        <InputGroup
          labelTxt="Nome"
          {...campo('nome')}
          defaultValue={tipo?.nome}
          maxLength={120}
          required
          autoFocus
          className="col-span-2"
        />
        <SelectGroup
          labelTxt="Categoria"
          {...campo('categoria')}
          opcoes={OPCOES_CATEGORIA}
          vazio="Escolha a categoria"
          defaultValue={tipo?.categoria ?? ''}
          required
        />
        <InputGroup
          labelTxt="Pontuação"
          {...campo('pontosBase')}
          defaultValue={tipo?.pontosBase}
          type="number"
          min={1}
          max={1000}
          required
          hint="De 1 a 1000"
        />
      </SecaoFormulario>

      <div className="flex items-center justify-end gap-3 rounded-b-lg bg-zinc-50 px-6 py-4">
        {erro && (
          <div className="mr-auto">
            <Alerta mensagem={erro} />
          </div>
        )}
        <Link to="/tipos-atendimento" className={BUTTON_CLASSES.secondary}>
          Cancelar
        </Link>
        <Button
          label={enviando ? 'Salvando…' : tipo ? 'Salvar alterações' : 'Cadastrar tipo'}
          style="primary"
          type="submit"
          disabled={enviando}
        />
      </div>
    </Form>
  )
}

// O ApiError só carrega o status
function mensagemDeErro(erro: unknown) {
  if (erro instanceof ApiError && erro.status === 409) return 'Já existe um tipo seu com esse nome.'
  if (erro instanceof ApiError && erro.status === 400)
    return 'O servidor não aceitou os dados. Confira os campos e tente novamente.'
  if (erro instanceof ApiError && erro.status === 404)
    return 'Tipo não encontrado. Volte à lista e abra o tipo de novo.'
  return 'Não foi possível salvar. Verifique sua conexão e tente novamente.'
}
