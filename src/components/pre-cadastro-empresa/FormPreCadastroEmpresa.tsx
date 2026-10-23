import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useValidacao, type Validacoes } from '@/hooks/useValidacao'
import { ApiError, post } from '@/lib/api'
import { mascararCnpj, mascararTelefone, somenteDigitos } from '@/lib/mascaras'
import { cnpjValido } from '@/lib/validacoes'
import BUTTON_CLASSES from '@/types/ButtonClasses'
import { Alerta } from '../common/Alerta'
import { Button } from '../common/Button'
import { Form } from '../common/Form'
import { InputGroup } from '../common/InputGroup'
import { SecaoFormulario } from '../common/SecaoFormulario'
import { VALIDACOES_EMPRESA } from '../empresa/validacoesEmpresa'
import type { EmpresaCadastrada } from './EmpresaPreCadastrada'

export interface FormPreCadastroEmpresaProps {
  onCadastrado: (empresa: EmpresaCadastrada) => void
}

type Campo = 'razaoSocial' | 'cnpj' | 'responsavel' | 'email' | 'telefone'

// Mesmas regras do PreCadastroEmpresaRequest no backend, com a mensagem do que corrigir
const VALIDACOES: Validacoes<Campo> = {
  razaoSocial: (valor) => (valor.trim() ? undefined : 'Informe a razão social.'),
  cnpj: (valor) => {
    const cnpj = somenteDigitos(valor)
    if (!cnpj) return 'Informe o CNPJ.'
    if (cnpj.length < 14) return 'O CNPJ deve ter 14 dígitos.'
    if (!cnpjValido(cnpj)) return 'CNPJ inválido. Confira os números digitados.'
  },
  responsavel: VALIDACOES_EMPRESA.responsavel,
  email: VALIDACOES_EMPRESA.email,
  telefone: VALIDACOES_EMPRESA.telefone,
}

export function FormPreCadastroEmpresa({ onCadastrado }: FormPreCadastroEmpresaProps) {
  const [erro, setErro] = useState<string>()
  const [enviando, setEnviando] = useState(false)
  const { campo, validarTodos } = useValidacao(VALIDACOES)

  async function cadastrar(dados: FormData) {
    if (!validarTodos(dados)) return

    setErro(undefined)
    setEnviando(true)
    try {
      const empresa = await post<EmpresaCadastrada>('/empresas/pre-cadastro', {
        razaoSocial: dados.get('razaoSocial'),
        cnpj: somenteDigitos(dados.get('cnpj')),
        responsavel: dados.get('responsavel'),
        email: dados.get('email'),
        telefone: somenteDigitos(dados.get('telefone')),
      })
      onCadastrado(empresa)
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Form
      onSubmit={cadastrar}
      noValidate
      className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white"
    >
      <SecaoFormulario titulo="Empresa" descricao="O CNPJ será o login temporário da empresa.">
        <InputGroup
          labelTxt="Razão social"
          {...campo('razaoSocial')}
          maxLength={150}
          required
          autoFocus
          className="col-span-2"
        />
        <InputGroup
          labelTxt="CNPJ"
          {...campo('cnpj', mascararCnpj)}
          placeholder="00.000.000/0000-00"
          inputMode="numeric"
          maxLength={18}
          required
        />
      </SecaoFormulario>

      <SecaoFormulario
        titulo="Contato"
        descricao="O login e a senha temporários são enviados para este e-mail."
      >
        <InputGroup
          labelTxt="Responsável"
          {...campo('responsavel')}
          maxLength={150}
          required
          className="col-span-2"
        />
        <InputGroup labelTxt="E-mail" {...campo('email')} type="email" maxLength={150} required />
        <InputGroup
          labelTxt="Telefone"
          {...campo('telefone', mascararTelefone)}
          type="tel"
          placeholder="(00) 00000-0000"
          maxLength={15}
          required
        />
      </SecaoFormulario>

      <div className="flex items-center justify-end gap-3 rounded-b-lg bg-zinc-50 px-6 py-4">
        {erro && (
          <div className="mr-auto">
            <Alerta mensagem={erro} />
          </div>
        )}
        <Link to="/empresas" className={BUTTON_CLASSES.secondary}>
          Cancelar
        </Link>
        <Button
          label={enviando ? 'Cadastrando…' : 'Cadastrar empresa'}
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
    return 'Já existe um cadastro com este CNPJ ou e-mail.'
  if (erro instanceof ApiError && erro.status === 400)
    return 'O servidor não aceitou os dados. Confira os campos e tente novamente.'
  return 'Não foi possível cadastrar a empresa nem enviar o e-mail de acesso. Tente novamente.'
}
