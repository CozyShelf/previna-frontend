import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { ApiError, get, post } from '@/lib/api'
import { hoje } from '@/lib/datas'
import BUTTON_CLASSES from '@/types/ButtonClasses'
import { CATEGORIAS, type TipoAtendimento } from '../tipo-atendimento/categorias'
import { Alerta } from '../common/Alerta'
import { Button } from '../common/Button'
import { Form } from '../common/Form'
import { Icone } from '../common/Icone'
import { InputGroup } from '../common/InputGroup'
import { SecaoFormulario } from '../common/SecaoFormulario'
import { SelectGroup } from '../common/SelectGroup'

// Teto por cadastro, igual ao do AgendamentoRequest no backend
const MAX_ITENS = 20

interface Item {
  // Identidade estável da linha: o índice mudaria ao remover uma do meio e o React reaproveitaria o campo errado
  chave: number
  tipoAtendimento: string
  dataPrevista: string
  observacao: string
}

interface ErrosItem {
  tipoAtendimento?: string
  dataPrevista?: string
}

const vazio = (chave: number): Item => ({
  chave,
  tipoAtendimento: '',
  dataPrevista: '',
  observacao: '',
})

// Mesmas regras do ItemAgendamentoRequest no backend; a observação é opcional
function validar(item: Item): ErrosItem {
  return {
    tipoAtendimento: item.tipoAtendimento ? undefined : 'Escolha o exame ou a consulta.',
    dataPrevista: !item.dataPrevista
      ? 'Informe a data prevista.'
      : item.dataPrevista < hoje()
        ? 'A data não pode ser no passado.'
        : undefined,
  }
}

export function FormAgendamento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tipos, setTipos] = useState<TipoAtendimento[]>()
  const [erroCarga, setErroCarga] = useState(false)
  const [itens, setItens] = useState<Item[]>([vazio(0)])
  const [erros, setErros] = useState<ErrosItem[]>([])
  const [erro, setErro] = useState<string>()
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    get<TipoAtendimento[]>('/tipos-atendimento')
      .then(setTipos)
      .catch(() => setErroCarga(true))
  }, [])

  // A categoria vai no rótulo, agrupando a lista sem precisar de um filtro à parte
  const opcoes = [...(tipos ?? [])]
    .sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nome.localeCompare(b.nome))
    .map((tipo) => ({
      valor: String(tipo.id),
      rotulo: `${CATEGORIAS[tipo.categoria]} · ${tipo.nome} (${tipo.pontosBase} pontos)`,
    }))

  function alterar(chave: number, campo: keyof Omit<Item, 'chave'>, valor: string) {
    setItens((atuais) =>
      atuais.map((item) => (item.chave === chave ? { ...item, [campo]: valor } : item)),
    )
    // Erro já exibido some assim que a linha é corrigida
    setErros((atuais) => (atuais.length ? [] : atuais))
  }

  async function salvar() {
    const encontrados = itens.map(validar)
    if (encontrados.some((item) => item.tipoAtendimento || item.dataPrevista)) {
      setErros(encontrados)
      return
    }

    setErro(undefined)
    setEnviando(true)
    try {
      const criados = await post<{ tipo: string }[]>('/agendamentos', {
        gestante: Number(id),
        itens: itens.map((item) => ({
          tipoAtendimento: Number(item.tipoAtendimento),
          dataPrevista: item.dataPrevista,
          // Em branco não vai, para ficar nulo no banco em vez de texto vazio
          ...(item.observacao.trim() && { observacao: item.observacao.trim() }),
        })),
      })
      navigate(`/gestantes/${id}`, { state: { mensagem: confirmacao(criados) } })
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
        titulo="Exames e consultas"
        descricao="Adicione quantos precisar: cada item vira um exame ou consulta próprio, com a sua data e a sua confirmação. A gestante vê tudo no app, e os pontos só são creditados quando você confirmar a realização."
      >
        {itens.map((item, indice) => (
          <fieldset key={item.chave} className="col-span-2 grid grid-cols-2 gap-x-4 gap-y-5">
            <legend className="sr-only">Exame ou consulta {indice + 1}</legend>
            <SelectGroup
              labelTxt="Exame ou consulta"
              name={`tipoAtendimento-${item.chave}`}
              opcoes={opcoes}
              vazio="Escolha o exame ou a consulta"
              value={item.tipoAtendimento}
              erro={erros[indice]?.tipoAtendimento}
              onChange={(e) => alterar(item.chave, 'tipoAtendimento', e.currentTarget.value)}
            />
            <InputGroup
              labelTxt="Data prevista"
              name={`dataPrevista-${item.chave}`}
              type="date"
              min={hoje()}
              value={item.dataPrevista}
              erro={erros[indice]?.dataPrevista}
              onChange={(e) => alterar(item.chave, 'dataPrevista', e.currentTarget.value)}
            />
            <InputGroup
              labelTxt="Observação"
              name={`observacao-${item.chave}`}
              hint="Opcional"
              maxLength={1000}
              placeholder="Ex.: jejum de 8h"
              value={item.observacao}
              onChange={(e) => alterar(item.chave, 'observacao', e.currentTarget.value)}
              className={itens.length > 1 ? '' : 'col-span-2'}
            />
            {/* A linha única não tem o que remover: o cadastro precisa de ao menos um item */}
            {itens.length > 1 && (
              <div className="flex items-end">
                <Button
                  label="Remover"
                  style="secondary"
                  onClick={() => {
                    setItens((atuais) => atuais.filter((atual) => atual.chave !== item.chave))
                    setErros([])
                  }}
                />
              </div>
            )}
          </fieldset>
        ))}

        {itens.length < MAX_ITENS && (
          <div className="col-span-2">
            <Button
              label="Adicionar exame ou consulta"
              style="secondary"
              icon={<Icone nome="adicionar" />}
              onClick={() =>
                setItens((atuais) => [
                  ...atuais,
                  vazio(Math.max(...atuais.map((i) => i.chave)) + 1),
                ])
              }
            />
          </div>
        )}
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

// "Cadastro de X realizado" concorda com qualquer tipo; "X cadastrado" erraria o gênero de "Consulta"
function confirmacao(criados: { tipo: string }[]) {
  return criados.length === 1
    ? `Cadastro de ${criados[0]?.tipo} realizado com sucesso.`
    : `Cadastro de ${criados.length} exames e consultas realizado com sucesso.`
}

function mensagemDeErro(erro: unknown) {
  if (erro instanceof ApiError && erro.status === 400)
    return 'O servidor não aceitou os dados. Confira os campos e tente novamente.'
  if (erro instanceof ApiError && erro.status === 404)
    return 'Gestante não encontrada. Volte à lista e abra a gestante de novo.'
  return 'Não foi possível salvar. Verifique sua conexão e tente novamente.'
}
