import { useState, type ChangeEvent, type FocusEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { ApiError, post } from '@/lib/api'
import { mascararCpf, mascararTelefone } from '@/lib/mascaras'
import { cpfValido } from '@/lib/validacoes'
import BUTTON_CLASSES from '@/types/ButtonClasses'
import { Alerta } from '../common/Alerta'
import { Button } from '../common/Button'
import { Form } from '../common/Form'
import { InputGroup } from '../common/InputGroup'
import type { Credenciais } from './CredenciaisTemporarias'

export interface FormPreCadastroGestanteProps {
  onCadastrado: (credenciais: Credenciais) => void
}

type Campo = 'nome' | 'cpf' | 'dataNascimento' | 'telefone' | 'email' | 'dum'
type Erros = Partial<Record<Campo, string>>

const hoje = () => new Date().toISOString().slice(0, 10)
const somenteDigitos = (valor: FormDataEntryValue | null) => String(valor ?? '').replace(/\D/g, '')
const dataInvalida = (valor: string) => !/^\d{4}-\d{2}-\d{2}$/.test(valor) || valor < '1900-01-01'

// Mesmas regras do PreCadastroGestanteRequest no backend, com a mensagem do que corrigir
const VALIDACOES: Record<Campo, (valor: string) => string | undefined> = {
  nome: (valor) => (valor.trim() ? undefined : 'Informe o nome completo.'),
  cpf: (valor) => {
    const cpf = somenteDigitos(valor)
    if (!cpf) return 'Informe o CPF.'
    if (cpf.length < 11) return 'O CPF deve ter 11 dígitos.'
    if (!cpfValido(cpf)) return 'CPF inválido. Confira os números digitados.'
  },
  dataNascimento: (valor) => {
    if (!valor) return 'Informe a data de nascimento.'
    if (dataInvalida(valor)) return 'Informe uma data válida.'
    if (valor >= hoje()) return 'A data de nascimento deve ser anterior a hoje.'
  },
  telefone: (valor) => {
    const telefone = somenteDigitos(valor)
    if (!telefone) return 'Informe o telefone.'
    if (telefone.length < 10) return 'Informe o DDD e o número, com 10 ou 11 dígitos.'
  },
  email: (valor) =>
    valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
      ? 'Informe um e-mail válido, como nome@exemplo.com.'
      : undefined,
  dum: (valor) => {
    if (!valor) return 'Informe a data da última menstruação.'
    if (dataInvalida(valor)) return 'Informe uma data válida.'
    if (valor > hoje()) return 'A DUM não pode ser uma data futura.'
  },
}

const CAMPOS = Object.keys(VALIDACOES) as Campo[]

export function FormPreCadastroGestante({ onCadastrado }: FormPreCadastroGestanteProps) {
  const [erro, setErro] = useState<string>()
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)

  // O erro aparece ao sair do campo (ou ao completá-lo); a partir daí é revalidado a cada tecla
  function validar(nome: Campo, valor: string, exibir: boolean) {
    setErros((atuais) =>
      exibir || nome in atuais ? { ...atuais, [nome]: VALIDACOES[nome](valor) } : atuais,
    )
  }

  function campo(nome: Campo, mascara?: (valor: string) => string) {
    return {
      name: nome,
      erro: erros[nome],
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const input = e.currentTarget
        if (mascara) input.value = mascara(input.value)
        validar(nome, input.value, input.value.length === input.maxLength)
      },
      onBlur: (e: FocusEvent<HTMLInputElement>) => validar(nome, e.currentTarget.value, true),
    }
  }

  async function cadastrar(dados: FormData) {
    const encontrados = Object.fromEntries(
      CAMPOS.map((nome) => [nome, VALIDACOES[nome](String(dados.get(nome) ?? ''))]),
    ) as Erros
    setErros(encontrados)
    const primeiroInvalido = CAMPOS.find((nome) => encontrados[nome])
    if (primeiroInvalido) {
      document.getElementsByName(primeiroInvalido)[0]?.focus()
      return
    }

    setErro(undefined)
    setEnviando(true)
    try {
      const credenciais = await post<Credenciais>('/gestantes/pre-cadastro', {
        nome: dados.get('nome'),
        cpf: somenteDigitos(dados.get('cpf')),
        dataNascimento: dados.get('dataNascimento'),
        telefone: somenteDigitos(dados.get('telefone')),
        email: dados.get('email') || undefined,
        dum: dados.get('dum'),
      })
      onCadastrado(credenciais)
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
      <Secao titulo="Identificação" descricao="O CPF será o login temporário da gestante.">
        <InputGroup
          labelTxt="Nome completo"
          {...campo('nome')}
          maxLength={150}
          required
          autoFocus
          className="col-span-2"
        />
        <InputGroup
          labelTxt="CPF"
          {...campo('cpf', mascararCpf)}
          placeholder="000.000.000-00"
          inputMode="numeric"
          maxLength={14}
          required
        />
        <InputGroup
          labelTxt="Data de nascimento"
          {...campo('dataNascimento')}
          type="date"
          min="1900-01-01"
          max={hoje()}
          required
        />
      </Secao>

      <Secao titulo="Contato">
        <InputGroup
          labelTxt="Telefone"
          {...campo('telefone', mascararTelefone)}
          type="tel"
          placeholder="(00) 00000-0000"
          maxLength={15}
          required
        />
        <InputGroup
          labelTxt="E-mail"
          {...campo('email')}
          type="email"
          maxLength={150}
          hint="Opcional"
        />
      </Secao>

      <Secao titulo="Gestação" descricao="A data provável do parto é calculada a partir da DUM.">
        <InputGroup
          labelTxt="Data da última menstruação (DUM)"
          {...campo('dum')}
          type="date"
          min="1900-01-01"
          max={hoje()}
          required
        />
      </Secao>

      <div className="flex items-center justify-end gap-3 rounded-b-lg bg-zinc-50 px-6 py-4">
        {erro && (
          <div className="mr-auto">
            <Alerta mensagem={erro} />
          </div>
        )}
        <Link to="/gestantes" className={BUTTON_CLASSES.secondary}>
          Cancelar
        </Link>
        <Button
          label={enviando ? 'Cadastrando…' : 'Cadastrar gestante'}
          style="primary"
          type="submit"
          disabled={enviando}
        />
      </div>
    </Form>
  )
}

interface SecaoProps {
  titulo: string
  descricao?: string
  children: ReactNode
}

function Secao({ titulo, descricao, children }: SecaoProps) {
  return (
    <section className="grid grid-cols-[220px_1fr] gap-8 px-6 py-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-zinc-900">{titulo}</h2>
        {descricao && <p className="text-[13px] text-zinc-500">{descricao}</p>}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">{children}</div>
    </section>
  )
}

function mensagemDeErro(erro: unknown) {
  if (erro instanceof ApiError && erro.status === 409)
    return 'Já existe um cadastro com este CPF ou e-mail.'
  if (erro instanceof ApiError && erro.status === 400)
    return 'O servidor não aceitou os dados. Confira os campos e tente novamente.'
  return 'Não foi possível cadastrar a gestante. Tente novamente.'
}
