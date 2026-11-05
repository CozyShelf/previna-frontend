import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useValidacao, type Validacoes } from '@/hooks/useValidacao'
import { ApiError, del, post, put, urlDaApi } from '@/lib/api'
import { erroImagem, TIPOS_IMAGEM } from '@/lib/validacoes'
import BUTTON_CLASSES from '@/types/ButtonClasses'
import { Alerta } from '../common/Alerta'
import { Button } from '../common/Button'
import { Form } from '../common/Form'
import { InputGroup } from '../common/InputGroup'
import { InputImagem } from '../common/InputImagem'
import { SecaoFormulario } from '../common/SecaoFormulario'
import { SelectGroup } from '../common/SelectGroup'
import { TextareaGroup } from '../common/TextareaGroup'
import { OPCOES_CATEGORIA, OPCOES_TIPO, USA_MIDIA, type Conteudo, type TipoConteudo } from './tipos'

type Campo = 'titulo' | 'categoria' | 'tipo' | 'corpo' | 'midiaUrl' | 'imagem'

// Mesmas regras do ConteudoRequest e do ConteudoService no backend: o tipo decide o obrigatório.
// temFotoSalva é a foto que já está no conteúdo editado: ela vale como mídia mesmo sem arquivo novo.
const validacoes = (temFotoSalva: boolean): Validacoes<Campo> => ({
  titulo: (valor) => (valor.trim() ? undefined : 'Informe o título do conteúdo.'),
  categoria: (valor) => (valor ? undefined : 'Escolha a categoria.'),
  tipo: (valor) => (valor ? undefined : 'Escolha o tipo.'),
  corpo: (valor, dados) => {
    if (dados.get('tipo') === 'TEXTO' && !valor.trim()) return 'Informe o corpo do texto.'
  },
  midiaUrl: (valor, dados) => {
    const tipo = String(dados.get('tipo')) as TipoConteudo
    if (!USA_MIDIA[tipo]) return
    const arquivo = dados.get('imagem')
    const temArquivo = arquivo instanceof File && arquivo.size > 0
    if (!valor.trim()) {
      if (tipo === 'FOTO' && (temArquivo || temFotoSalva)) return
      return tipo === 'FOTO'
        ? 'Envie uma imagem ou informe o endereço da foto.'
        : 'Informe o endereço da mídia.'
    }
    if (!/^https?:\/\/\S+$/.test(valor.trim()))
      return 'Informe um endereço completo, começando com http:// ou https://.'
  },
  imagem: (_, dados) => erroImagem(dados.get('imagem')),
})

export interface FormConteudoProps {
  // Presente na edição
  conteudo?: Conteudo
}

export function FormConteudo({ conteudo }: FormConteudoProps) {
  const navigate = useNavigate()
  const [erro, setErro] = useState<string>()
  const [enviando, setEnviando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  // Controlado porque decide quais campos de mídia aparecem
  const [tipo, setTipo] = useState<string>(conteudo?.tipo ?? '')
  const temFotoSalva = conteudo?.tipo === 'FOTO' && !!conteudo.midiaUrl
  const { campo, validarTodos } = useValidacao(validacoes(temFotoSalva))
  const propsTipo = campo('tipo')

  async function salvar(dados: FormData) {
    if (!validarTodos(dados)) return

    setErro(undefined)
    setEnviando(true)
    try {
      // Vai como multipart por causa da imagem
      // Opcional em branco não vai, para ficar nulo no banco em vez de texto vazio
      for (const nome of ['resumo', 'corpo', 'midiaUrl']) {
        if (!String(dados.get(nome)).trim()) dados.delete(nome)
      }
      const imagem = dados.get('imagem')
      if (!(imagem instanceof File) || !imagem.size) dados.delete('imagem')

      // Na edição a imagem só é enviada quando trocada; sem ela, o backend mantém a atual
      if (conteudo) await put(`/conteudos/${conteudo.id}`, dados)
      else await post('/conteudos', dados)
      voltar(
        `Conteúdo ${dados.get('titulo')} ${conteudo ? 'atualizado' : 'cadastrado'} com sucesso.`,
      )
    } catch (e) {
      setErro(mensagemDeErro(e))
      setEnviando(false)
    }
  }

  // Publicar é uma ação à parte do salvar: o conteúdo nasce rascunho e só vai para o app quando o
  // admin decide. Despublicar o tira do app sem apagá-lo.
  async function alterarPublicacao() {
    if (!conteudo) return
    await acao(
      () => put(`/conteudos/${conteudo.id}/publicado`, { publicado: !conteudo.publicado }),
      `Conteúdo ${conteudo.titulo} ${conteudo.publicado ? 'despublicado' : 'publicado'} com sucesso.`,
    )
  }

  async function excluir() {
    if (!conteudo) return
    await acao(
      () => del(`/conteudos/${conteudo.id}`),
      `Conteúdo ${conteudo.titulo} excluído com sucesso.`,
    )
  }

  async function acao(executar: () => Promise<unknown>, mensagem: string) {
    setErro(undefined)
    setOcupado(true)
    try {
      await executar()
      voltar(mensagem)
    } catch (e) {
      setErro(mensagemDeErro(e))
      setOcupado(false)
    }
  }

  function voltar(mensagem: string) {
    navigate('/conteudos', { state: { mensagem } })
  }

  const usaMidia = USA_MIDIA[tipo as TipoConteudo] ?? false

  return (
    <Form
      onSubmit={salvar}
      noValidate
      className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white"
    >
      <SecaoFormulario
        titulo="Conteúdo educativo"
        descricao="As gestantes veem os conteúdos publicados na tela inicial do aplicativo. O tipo decide como o conteúdo é exibido lá."
      >
        <InputGroup
          labelTxt="Título"
          {...campo('titulo')}
          defaultValue={conteudo?.titulo}
          maxLength={150}
          required
          autoFocus
          className="col-span-2"
        />
        <SelectGroup
          labelTxt="Categoria"
          {...campo('categoria')}
          opcoes={OPCOES_CATEGORIA}
          vazio="Escolha a categoria"
          defaultValue={conteudo?.categoria ?? ''}
          required
        />
        <SelectGroup
          labelTxt="Tipo"
          {...propsTipo}
          opcoes={OPCOES_TIPO}
          vazio="Escolha o tipo"
          value={tipo}
          onChange={(e) => {
            setTipo(e.currentTarget.value)
            propsTipo.onChange(e)
          }}
          required
          hint="Decide como aparece no app"
        />
        <InputGroup
          labelTxt="Resumo"
          name="resumo"
          defaultValue={conteudo?.resumo}
          hint="Opcional"
          maxLength={300}
          placeholder="Uma ou duas linhas, mostradas no card do app"
          className="col-span-2"
        />
        <TextareaGroup
          labelTxt="Corpo do texto"
          {...campo('corpo')}
          defaultValue={conteudo?.corpo}
          hint={tipo === 'TEXTO' ? 'Obrigatório para o tipo Texto' : 'Opcional'}
          className="col-span-2"
        />
        {usaMidia && (
          <InputGroup
            labelTxt={tipo === 'FOTO' ? 'Endereço da foto' : 'Endereço da mídia'}
            {...campo('midiaUrl')}
            defaultValue={temFotoSalva ? undefined : conteudo?.midiaUrl}
            maxLength={500}
            placeholder="https://"
            hint={tipo === 'FOTO' ? 'Ou envie uma imagem abaixo' : 'Obrigatório'}
            className="col-span-2"
          />
        )}
        {tipo === 'FOTO' && (
          <InputImagem
            labelTxt="Imagem"
            {...campo('imagem')}
            atual={conteudo?.midiaUrl && temFotoSalva ? urlDaApi(conteudo.midiaUrl) : undefined}
            accept={TIPOS_IMAGEM.join(',')}
            descricao="PNG, JPG ou WebP, com até 2 MB."
            className="col-span-2"
          />
        )}
      </SecaoFormulario>

      <div className="flex items-center justify-end gap-3 rounded-b-lg bg-zinc-50 px-6 py-4">
        {erro && (
          <div className="mr-auto">
            <Alerta mensagem={erro} />
          </div>
        )}
        {conteudo && (
          <>
            <Button
              label={conteudo.publicado ? 'Despublicar' : 'Publicar'}
              style="secondary"
              className={erro ? '' : 'mr-auto'}
              disabled={enviando || ocupado}
              onClick={alterarPublicacao}
            />
            <Button
              label="Excluir"
              style="secondary"
              disabled={enviando || ocupado}
              onClick={excluir}
            />
          </>
        )}
        <Link to="/conteudos" className={BUTTON_CLASSES.secondary}>
          Cancelar
        </Link>
        <Button
          label={enviando ? 'Salvando…' : conteudo ? 'Salvar alterações' : 'Salvar rascunho'}
          style="primary"
          type="submit"
          disabled={enviando || ocupado}
        />
      </div>
    </Form>
  )
}

function mensagemDeErro(erro: unknown) {
  if (erro instanceof ApiError && erro.status === 400)
    return 'O servidor não aceitou os dados ou a imagem. Confira os campos e tente novamente.'
  if (erro instanceof ApiError && erro.status === 413)
    return 'A imagem é grande demais. Escolha uma com até 2 MB.'
  if (erro instanceof ApiError && erro.status === 404)
    return 'Conteúdo não encontrado. Volte à lista e abra o conteúdo de novo.'
  return 'Não foi possível salvar. Verifique sua conexão e tente novamente.'
}
