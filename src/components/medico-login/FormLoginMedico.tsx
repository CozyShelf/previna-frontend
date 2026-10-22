import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ApiError, post } from '@/lib/api'
import { perfilDoToken, salvarToken } from '@/lib/auth'
import { Alerta } from '../common/Alerta'
import { Button } from '../common/Button'
import { Form } from '../common/Form'
import { InputGroup } from '../common/InputGroup'

interface TokenResponse {
  token: string
}

export function FormLoginMedico() {
  const navigate = useNavigate()
  const [erro, setErro] = useState<string>()
  const [enviando, setEnviando] = useState(false)

  async function entrar(dados: FormData) {
    setErro(undefined)
    setEnviando(true)
    try {
      const { token } = await post<TokenResponse>('/auth/login', {
        login: dados.get('login'),
        senha: dados.get('senha'),
      })
      if (perfilDoToken(token) !== 'MEDICO') {
        setErro('Acesso permitido apenas para médicos.')
        return
      }
      salvarToken(token)
      navigate('/', { replace: true })
    } catch (e) {
      setErro(
        e instanceof ApiError && e.status === 401
          ? 'Login ou senha inválidos.'
          : 'Não foi possível entrar. Verifique sua conexão e tente novamente.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Form onSubmit={entrar} className="flex flex-col gap-5">
      <InputGroup
        labelTxt="Login"
        name="login"
        autoComplete="username"
        maxLength={50}
        required
        autoFocus
      />
      <InputGroup
        labelTxt="Senha"
        name="senha"
        type="password"
        autoComplete="current-password"
        maxLength={72}
        required
        hint={
          <a href="/recuperar-senha" className="font-medium text-previna-600 hover:underline">
            Esqueceu a senha?
          </a>
        }
      />

      {erro && <Alerta mensagem={erro} />}

      <Button
        label={enviando ? 'Entrando…' : 'Entrar'}
        style="primary"
        type="submit"
        disabled={enviando}
        className="w-full"
      />
    </Form>
  )
}
