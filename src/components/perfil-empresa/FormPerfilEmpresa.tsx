import { useEffect, useState } from 'react'

import { useValidacao, type Validacoes } from '@/hooks/useValidacao'
import { ApiError, get, put, urlDaApi } from '@/lib/api'
import { mascararTelefone, somenteDigitos } from '@/lib/mascaras'
import { Alerta } from '../common/Alerta'
import { Button } from '../common/Button'
import { Form } from '../common/Form'
import { InputGroup } from '../common/InputGroup'
import { SecaoFormulario } from '../common/SecaoFormulario'
import { SecaoSobreEmpresa } from '../empresa/SecaoSobreEmpresa'
import { VALIDACOES_EMPRESA } from '../empresa/validacoesEmpresa'

interface PerfilEmpresa {
  email: string
  telefone: string
  responsavel: string
  endereco: string
  segmento: string
  descricao?: string
  logoUrl?: string
}

export interface FormPerfilEmpresaProps {
  onSalvo: () => void
}

type Campo = keyof typeof VALIDACOES_EMPRESA

const VALIDACOES: Validacoes<Campo> = VALIDACOES_EMPRESA

export function FormPerfilEmpresa({ onSalvo }: FormPerfilEmpresaProps) {
  const [empresa, setEmpresa] = useState<PerfilEmpresa>()
  const [erroCarga, setErroCarga] = useState(false)
  // Remonta o formulário com os dados salvos (limpa o arquivo escolhido)
  const [versao, setVersao] = useState(0)
  const [erro, setErro] = useState<string>()
  const [salvo, setSalvo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const { campo, validarTodos } = useValidacao(VALIDACOES)

  useEffect(() => {
    get<PerfilEmpresa>('/empresas/perfil')
      .then(setEmpresa)
      .catch(() => setErroCarga(true))
  }, [])

  async function salvar(dados: FormData) {
    setSalvo(false)
    if (!validarTodos(dados)) return

    setErro(undefined)
    setEnviando(true)
    try {
      // Vai como multipart por causa do logo
      dados.set('telefone', somenteDigitos(dados.get('telefone')))
      const logo = dados.get('logo')
      if (!(logo instanceof File) || !logo.size) dados.delete('logo')

      setEmpresa(await put<PerfilEmpresa>('/empresas/perfil', dados))
      setVersao((atual) => atual + 1)
      setSalvo(true)
      onSalvo()
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setEnviando(false)
    }
  }

  if (erroCarga) {
    return (
      <Alerta mensagem="Não foi possível carregar os dados da empresa. Recarregue a página para tentar de novo." />
    )
  }
  if (!empresa) return <p className="text-zinc-500">Carregando dados da empresa…</p>

  return (
    <Form
      key={versao}
      onSubmit={salvar}
      noValidate
      className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white"
    >
      <SecaoFormulario titulo="Contato" descricao="Como a equipe do Previna fala com a empresa.">
        <InputGroup
          labelTxt="Responsável"
          {...campo('responsavel')}
          defaultValue={empresa.responsavel}
          maxLength={150}
          required
          className="col-span-2"
        />
        <InputGroup
          labelTxt="E-mail"
          {...campo('email')}
          defaultValue={empresa.email}
          type="email"
          maxLength={150}
          required
        />
        <InputGroup
          labelTxt="Telefone"
          {...campo('telefone', mascararTelefone)}
          defaultValue={mascararTelefone(empresa.telefone)}
          type="tel"
          placeholder="(00) 00000-0000"
          maxLength={15}
          required
        />
      </SecaoFormulario>

      <SecaoSobreEmpresa
        campo={campo}
        valores={{ ...empresa, logo: empresa.logoUrl && urlDaApi(empresa.logoUrl) }}
      />

      <div className="flex items-center justify-end gap-3 rounded-b-lg bg-zinc-50 px-6 py-4">
        {erro && (
          <div className="mr-auto">
            <Alerta mensagem={erro} />
          </div>
        )}
        {salvo && (
          <p role="status" className="mr-auto text-sm font-medium text-emerald-700">
            Alterações salvas.
          </p>
        )}
        <Button
          label={enviando ? 'Salvando…' : 'Salvar alterações'}
          style="primary"
          type="submit"
          disabled={enviando}
        />
      </div>
    </Form>
  )
}

function mensagemDeErro(erro: unknown) {
  if (erro instanceof ApiError && erro.status === 409)
    return 'Este e-mail já está em uso por outro cadastro.'
  if (erro instanceof ApiError && erro.status === 400)
    return 'O servidor não aceitou os dados ou o logo. Confira os campos e tente novamente.'
  if (erro instanceof ApiError && erro.status === 413)
    return 'A imagem do logo é grande demais. Escolha uma com até 2 MB.'
  return 'Não foi possível salvar. Verifique sua conexão e tente novamente.'
}
