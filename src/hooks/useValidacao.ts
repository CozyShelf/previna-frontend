import { useState, type ChangeEvent, type FocusEvent } from 'react'

// Recebe o valor do campo e o formulário inteiro (ex.: para conferir a confirmação de senha)
export type Validacoes<C extends string> = Record<
  C,
  (valor: string, dados: FormData) => string | undefined
>

export interface PropsCampo {
  name: string
  erro?: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onBlur: (e: FocusEvent<HTMLInputElement>) => void
}

// O erro aparece ao sair do campo (ou ao completá-lo); a partir daí é revalidado a cada tecla
export function useValidacao<C extends string>(validacoes: Validacoes<C>) {
  const [erros, setErros] = useState<Partial<Record<C, string>>>({})

  function validar(input: HTMLInputElement, exibir: boolean) {
    const nome = input.name as C
    const erro = validacoes[nome](input.value, new FormData(input.form ?? undefined))
    setErros((atuais) => (exibir || nome in atuais ? { ...atuais, [nome]: erro } : atuais))
  }

  function campo(nome: C, mascara?: (valor: string) => string): PropsCampo {
    return {
      name: nome,
      erro: erros[nome],
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const input = e.currentTarget
        if (mascara) input.value = mascara(input.value)
        // Arquivo escolhido já mostra o erro; texto só quando completa o tamanho máximo
        validar(input, input.type === 'file' || input.value.length === input.maxLength)
      },
      onBlur: (e: FocusEvent<HTMLInputElement>) => validar(e.currentTarget, true),
    }
  }

  // No envio valida tudo e leva o foco ao primeiro campo com erro
  function validarTodos(dados: FormData) {
    const nomes = Object.keys(validacoes) as C[]
    const encontrados = Object.fromEntries(
      nomes.map((nome) => [nome, validacoes[nome](String(dados.get(nome) ?? ''), dados)]),
    ) as Partial<Record<C, string>>
    setErros(encontrados)
    const primeiroInvalido = nomes.find((nome) => encontrados[nome])
    if (primeiroInvalido) document.getElementsByName(primeiroInvalido)[0]?.focus()
    return !primeiroInvalido
  }

  return { campo, validarTodos }
}
