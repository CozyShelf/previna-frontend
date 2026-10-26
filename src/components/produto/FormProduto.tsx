import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useValidacao, type Validacoes } from '@/hooks/useValidacao'
import { ApiError, post, put, urlDaApi } from '@/lib/api'
import { decimalDaApi } from '@/lib/mascaras'
import { erroImagem, TIPOS_IMAGEM } from '@/lib/validacoes'
import BUTTON_CLASSES from '@/types/ButtonClasses'
import { Alerta } from '../common/Alerta'
import { Button } from '../common/Button'
import { Form } from '../common/Form'
import { InputGroup } from '../common/InputGroup'
import { InputImagem } from '../common/InputImagem'
import { SecaoFormulario } from '../common/SecaoFormulario'
import { SelectGroup } from '../common/SelectGroup'
import { OPCOES_CATEGORIA, type Categoria } from './categorias'

export interface Produto {
  id: number
  nome: string
  descricao?: string
  categoria?: Categoria
  preco?: number
  imagemUrl?: string
}

type Campo = 'nome' | 'preco' | 'imagem'

// Mesmas regras do ProdutoRequest no backend; só o nome é obrigatório
const VALIDACOES: Validacoes<Campo> = {
  nome: (valor) => (valor.trim() ? undefined : 'Informe o nome do produto.'),
  preco: (valor) => {
    if (valor.trim() && !/^\d{1,8}([.,]\d{1,2})?$/.test(valor.trim()))
      return 'Informe o preço em reais, só com a vírgula dos centavos, como 39,90.'
  },
  imagem: (_, dados) => erroImagem(dados.get('imagem')),
}

export interface FormProdutoProps {
  // Presente na edição
  produto?: Produto
}

export function FormProduto({ produto }: FormProdutoProps) {
  const navigate = useNavigate()
  const [erro, setErro] = useState<string>()
  const [enviando, setEnviando] = useState(false)
  const { campo, validarTodos } = useValidacao(VALIDACOES)

  async function salvar(dados: FormData) {
    if (!validarTodos(dados)) return

    setErro(undefined)
    setEnviando(true)
    try {
      // Vai como multipart por causa da imagem
      dados.set('preco', decimalDaApi(dados.get('preco')))
      // Opcional em branco não vai, para ficar nulo no banco em vez de texto vazio
      for (const nome of ['categoria', 'preco', 'descricao']) {
        if (!String(dados.get(nome)).trim()) dados.delete(nome)
      }
      const imagem = dados.get('imagem')
      if (!(imagem instanceof File) || !imagem.size) dados.delete('imagem')

      // Na edição a imagem só é enviada quando trocada; sem ela, o backend mantém a atual
      if (produto) await put(`/empresas/produtos/${produto.id}`, dados)
      else await post('/empresas/produtos', dados)
      navigate('/produtos', {
        state: {
          mensagem: `Produto ${dados.get('nome')} ${produto ? 'atualizado' : 'cadastrado'} com sucesso.`,
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
        titulo="Produto"
        descricao="As gestantes veem esses dados junto com as promoções e os cupons da empresa. O preço é o normal, sem desconto: cupons e promoções aplicam o desconto sobre ele."
      >
        <InputGroup
          labelTxt="Nome"
          {...campo('nome')}
          defaultValue={produto?.nome}
          maxLength={150}
          required
          autoFocus
          className="col-span-2"
        />
        <SelectGroup
          labelTxt="Categoria"
          name="categoria"
          opcoes={OPCOES_CATEGORIA}
          vazio="Sem categoria"
          defaultValue={produto?.categoria ?? ''}
          hint="Entra nas promoções da categoria"
        />
        <InputGroup
          labelTxt="Preço sem desconto (R$)"
          {...campo('preco')}
          defaultValue={produto?.preco?.toFixed(2).replace('.', ',')}
          hint="Opcional"
          placeholder="0,00"
          inputMode="decimal"
          maxLength={11}
        />
        <InputGroup
          labelTxt="Descrição"
          name="descricao"
          defaultValue={produto?.descricao}
          hint="Opcional"
          maxLength={1000}
          className="col-span-2"
        />
        <InputImagem
          labelTxt="Imagem"
          {...campo('imagem')}
          atual={produto?.imagemUrl && urlDaApi(produto.imagemUrl)}
          accept={TIPOS_IMAGEM.join(',')}
          hint="Opcional"
          descricao="PNG, JPG ou WebP, com até 2 MB."
          className="col-span-2"
        />
      </SecaoFormulario>

      <div className="flex items-center justify-end gap-3 rounded-b-lg bg-zinc-50 px-6 py-4">
        {erro && (
          <div className="mr-auto">
            <Alerta mensagem={erro} />
          </div>
        )}
        <Link to="/produtos" className={BUTTON_CLASSES.secondary}>
          Cancelar
        </Link>
        <Button
          label={enviando ? 'Salvando…' : produto ? 'Salvar alterações' : 'Cadastrar produto'}
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
    return 'O servidor não aceitou os dados ou a imagem. Confira os campos e tente novamente.'
  if (erro instanceof ApiError && erro.status === 413)
    return 'A imagem é grande demais. Escolha uma com até 2 MB.'
  return 'Não foi possível salvar. Verifique sua conexão e tente novamente.'
}
