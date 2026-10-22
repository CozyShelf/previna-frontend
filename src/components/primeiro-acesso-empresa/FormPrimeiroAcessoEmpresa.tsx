import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useValidacao, type Validacoes } from '@/hooks/useValidacao'
import { ApiError, put } from '@/lib/api'
import { salvarToken } from '@/lib/auth'
import { erroLogin, erroSenha } from '@/lib/validacoes'
import { Alerta } from '../common/Alerta'
import { Button } from '../common/Button'
import { Form } from '../common/Form'
import { InputGroup } from '../common/InputGroup'
import { SecaoFormulario } from '../common/SecaoFormulario'
import { SecaoSobreEmpresa } from '../empresa/SecaoSobreEmpresa'
import { VALIDACOES_EMPRESA } from '../empresa/validacoesEmpresa'

type Campo = 'novoLogin' | 'novaSenha' | 'confirmacao' | 'segmento' | 'endereco' | 'logo'

// Mesmas regras do PrimeiroAcessoEmpresaRequest no backend, com a mensagem do que corrigir
const VALIDACOES: Validacoes<Campo> = {
  novoLogin: (valor) => (valor ? erroLogin(valor) : 'Informe o novo login.'),
  novaSenha: (valor) => (valor ? erroSenha(valor) : 'Crie uma senha.'),
  confirmacao: (valor, dados) => {
    if (!valor) return 'Repita a nova senha.'
    if (valor !== dados.get('novaSenha')) return 'As senhas não conferem.'
  },
  segmento: VALIDACOES_EMPRESA.segmento,
  endereco: VALIDACOES_EMPRESA.endereco,
  logo: VALIDACOES_EMPRESA.logo,
}

export function FormPrimeiroAcessoEmpresa() {
  const navigate = useNavigate()
  const [erro, setErro] = useState<string>()
  const [enviando, setEnviando] = useState(false)
  const { campo, validarTodos } = useValidacao(VALIDACOES)

  async function salvar(dados: FormData) {
    if (!validarTodos(dados)) return

    setErro(undefined)
    setEnviando(true)
    try {
      // Vai como multipart por causa do logo; só os campos que o backend espera
      dados.delete('confirmacao')
      if (!dados.get('descricao')) dados.delete('descricao')
      const logo = dados.get('logo')
      if (!(logo instanceof File) || !logo.size) dados.delete('logo')

      // O token da senha temporária só servia para esta etapa; segue com o novo
      const { token } = await put<{ token: string }>('/empresas/primeiro-acesso', dados)
      salvarToken(token)
      navigate('/tutorial', { replace: true })
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
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
        titulo="Acesso"
        descricao="Troque o login e a senha temporários por outros que só você saiba."
      >
        <InputGroup
          labelTxt="Novo login"
          {...campo('novoLogin')}
          autoComplete="username"
          maxLength={50}
          required
          autoFocus
          className="col-span-2"
        />
        <InputGroup
          labelTxt="Nova senha"
          {...campo('novaSenha')}
          type="password"
          autoComplete="new-password"
          hint="Mínimo de 8, com letras e números"
          maxLength={72}
          required
        />
        <InputGroup
          labelTxt="Confirme a nova senha"
          {...campo('confirmacao')}
          type="password"
          autoComplete="new-password"
          maxLength={72}
          required
        />
      </SecaoFormulario>

      <SecaoSobreEmpresa campo={campo} />

      <div className="flex items-center justify-end gap-3 rounded-b-lg bg-zinc-50 px-6 py-4">
        {erro && (
          <div className="mr-auto">
            <Alerta mensagem={erro} />
          </div>
        )}
        <Button
          label={enviando ? 'Salvando…' : 'Salvar e continuar'}
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
    return 'Este login já está em uso. Escolha outro.'
  if (erro instanceof ApiError && erro.status === 400)
    return 'O servidor não aceitou os dados ou o logo. Confira os campos e tente novamente.'
  if (erro instanceof ApiError && erro.status === 413)
    return 'A imagem do logo é grande demais. Escolha uma com até 2 MB.'
  return 'Não foi possível salvar. Verifique sua conexão e tente novamente.'
}
