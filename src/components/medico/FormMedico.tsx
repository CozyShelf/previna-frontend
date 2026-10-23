import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useValidacao, type Validacoes } from '@/hooks/useValidacao'
import { ApiError, post, put } from '@/lib/api'
import { mascararCpf, somenteDigitos } from '@/lib/mascaras'
import { erroCpf, erroEmail, erroLogin, erroSenha } from '@/lib/validacoes'
import BUTTON_CLASSES from '@/types/ButtonClasses'
import { Alerta } from '../common/Alerta'
import { Button } from '../common/Button'
import { Form } from '../common/Form'
import { InputGroup } from '../common/InputGroup'
import { SecaoFormulario } from '../common/SecaoFormulario'

export interface Medico {
  id: number
  nome: string
  cpf: string
  email: string
  crm: string
  login: string
  verTodasGestantes: boolean
}

export interface FormMedicoProps {
  // Sem médico é cadastro; com médico é edição
  medico?: Medico
}

type Campo = 'nome' | 'cpf' | 'crm' | 'email' | 'login' | 'senha' | 'confirmacao'

// Mesmas regras do MedicoRequest no backend; na edição a senha em branco mantém a atual
function validacoes(edicao: boolean): Validacoes<Campo> {
  return {
    nome: (valor) => (valor.trim() ? undefined : 'Informe o nome completo.'),
    cpf: erroCpf,
    crm: (valor) => (valor.trim() ? undefined : 'Informe o CRM.'),
    email: (valor) => (valor ? erroEmail(valor) : 'Informe o e-mail.'),
    login: (valor) => (valor ? erroLogin(valor) : 'Informe o login.'),
    senha: (valor) => {
      if (valor) return erroSenha(valor)
      if (!edicao) return 'Defina uma senha.'
    },
    confirmacao: (valor, dados) => {
      if (!dados.get('senha')) return
      if (!valor) return 'Repita a senha.'
      if (valor !== dados.get('senha')) return 'As senhas não conferem.'
    },
  }
}

export function FormMedico({ medico }: FormMedicoProps) {
  const navigate = useNavigate()
  const [erro, setErro] = useState<string>()
  const [enviando, setEnviando] = useState(false)
  const { campo, validarTodos } = useValidacao(validacoes(Boolean(medico)))

  async function salvar(dados: FormData) {
    if (!validarTodos(dados)) return

    setErro(undefined)
    setEnviando(true)
    try {
      const corpo = {
        nome: dados.get('nome'),
        cpf: somenteDigitos(dados.get('cpf')),
        crm: dados.get('crm'),
        email: dados.get('email'),
        login: dados.get('login'),
        senha: dados.get('senha') || undefined,
        verTodasGestantes: dados.get('verTodasGestantes') === 'on',
      }
      if (medico) await put(`/medicos/${medico.id}`, corpo)
      else await post('/medicos', corpo)
      navigate('/medicos', {
        state: {
          mensagem: medico
            ? `Dados de ${corpo.nome} atualizados.`
            : `${corpo.nome} cadastrado. Repasse o login e a senha ao médico.`,
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
      <SecaoFormulario titulo="Médico" descricao="Identificação e contato do médico.">
        <InputGroup
          labelTxt="Nome completo"
          {...campo('nome')}
          defaultValue={medico?.nome}
          maxLength={150}
          required
          autoFocus
          className="col-span-2"
        />
        <InputGroup
          labelTxt="CPF"
          {...campo('cpf', mascararCpf)}
          defaultValue={medico && mascararCpf(medico.cpf)}
          placeholder="000.000.000-00"
          inputMode="numeric"
          maxLength={14}
          required
        />
        <InputGroup
          labelTxt="CRM"
          {...campo('crm')}
          defaultValue={medico?.crm}
          placeholder="CRM-SP 123456"
          maxLength={20}
          required
        />
        <InputGroup
          labelTxt="E-mail"
          {...campo('email')}
          defaultValue={medico?.email}
          type="email"
          maxLength={150}
          required
          className="col-span-2"
        />
      </SecaoFormulario>

      <SecaoFormulario
        titulo="Acesso"
        descricao={
          medico
            ? 'Só o administrador troca a senha do médico. Deixe a senha em branco para manter a atual.'
            : 'Defina o login e a senha e repasse-os ao médico. Só o administrador pode trocá-los depois.'
        }
      >
        <InputGroup
          labelTxt="Login"
          {...campo('login')}
          defaultValue={medico?.login}
          autoComplete="off"
          maxLength={50}
          required
          className="col-span-2"
        />
        <InputGroup
          labelTxt={medico ? 'Nova senha' : 'Senha'}
          {...campo('senha')}
          type="password"
          autoComplete="new-password"
          hint="Mínimo de 8, com letras e números"
          maxLength={72}
          required={!medico}
        />
        <InputGroup
          labelTxt={medico ? 'Confirme a nova senha' : 'Confirme a senha'}
          {...campo('confirmacao')}
          type="password"
          autoComplete="new-password"
          maxLength={72}
          required={!medico}
        />
      </SecaoFormulario>

      <SecaoFormulario
        titulo="Permissões"
        descricao="Por padrão, o médico só vê as gestantes que ele acompanha."
      >
        <label className="col-span-2 flex items-start gap-3">
          <input
            type="checkbox"
            name="verTodasGestantes"
            defaultChecked={medico?.verTodasGestantes}
            className="mt-0.5 size-4 accent-previna-600"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-[13px] font-medium text-zinc-700">Ver todas as gestantes</span>
            <span className="text-xs text-zinc-500">
              Na lista de gestantes, o médico vê também as acompanhadas por outros médicos.
            </span>
          </span>
        </label>
      </SecaoFormulario>

      <div className="flex items-center justify-end gap-3 rounded-b-lg bg-zinc-50 px-6 py-4">
        {erro && (
          <div className="mr-auto">
            <Alerta mensagem={erro} />
          </div>
        )}
        <Link to="/medicos" className={BUTTON_CLASSES.secondary}>
          Cancelar
        </Link>
        <Button
          label={enviando ? 'Salvando…' : medico ? 'Salvar alterações' : 'Cadastrar médico'}
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
    return 'Já existe um cadastro com este CPF, CRM, e-mail ou login.'
  if (erro instanceof ApiError && erro.status === 400)
    return 'O servidor não aceitou os dados. Confira os campos e tente novamente.'
  return 'Não foi possível salvar. Verifique sua conexão e tente novamente.'
}
