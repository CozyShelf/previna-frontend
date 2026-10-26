import { decimalDaApi, somenteDigitos } from '@/lib/mascaras'

// Mesma regra do @CPF do backend: 11 dígitos, não todos iguais e os dois verificadores corretos
export function cpfValido(cpf: string) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false

  const verificador = (tamanho: number) => {
    const soma = [...cpf.slice(0, tamanho)].reduce(
      (total, digito, i) => total + Number(digito) * (tamanho + 1 - i),
      0,
    )
    return ((soma * 10) % 11) % 10
  }
  return verificador(9) === Number(cpf[9]) && verificador(10) === Number(cpf[10])
}

export function erroCpf(valor: string) {
  const cpf = somenteDigitos(valor)
  if (!cpf) return 'Informe o CPF.'
  if (cpf.length < 11) return 'O CPF deve ter 11 dígitos.'
  if (!cpfValido(cpf)) return 'CPF inválido. Confira os números digitados.'
}

// Mesma regra do backend (@CNPJ e sem dígitos todos iguais): 14 dígitos e os dois verificadores corretos
export function cnpjValido(cnpj: string) {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false

  // Pesos de 2 a 9 da direita para a esquerda, recomeçando em 2 depois do 9
  const verificador = (tamanho: number) => {
    const soma = [...cnpj.slice(0, tamanho)].reduce(
      (total, digito, i) => total + Number(digito) * (((tamanho - 1 - i) % 8) + 2),
      0,
    )
    return soma % 11 < 2 ? 0 : 11 - (soma % 11)
  }
  return verificador(12) === Number(cnpj[12]) && verificador(13) === Number(cnpj[13])
}

// Mesmos limites do backend: tipo conferido pelo conteúdo e spring.servlet.multipart.max-file-size
export const TIPOS_IMAGEM = ['image/png', 'image/jpeg', 'image/webp']
const TAMANHO_MAXIMO_IMAGEM = 2 * 1024 * 1024

// Sem arquivo escolhido não há erro: a imagem é sempre opcional
export function erroImagem(arquivo: FormDataEntryValue | null) {
  if (!(arquivo instanceof File) || !arquivo.size) return
  if (!TIPOS_IMAGEM.includes(arquivo.type)) return 'Escolha uma imagem PNG, JPG ou WebP.'
  if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) return 'A imagem deve ter no máximo 2 MB.'
}

// Mesma regra do backend para desconto percentual (promoção e cupom)
export function erroDesconto(valor: string) {
  if (!valor.trim()) return 'Informe o desconto.'
  const desconto = Number(decimalDaApi(valor))
  if (!/^\d{1,3}([.,]\d{1,2})?$/.test(valor.trim()) || desconto <= 0 || desconto > 100)
    return 'Informe um percentual maior que 0 e até 100, como 15 ou 12,5.'
}

// Regras de formato do backend; quem chama decide se o campo vazio é erro
export function erroEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return 'Informe um e-mail válido, como nome@exemplo.com.'
}

export function erroLogin(login: string) {
  if (/[^A-Za-z0-9._-]/.test(login))
    return 'Use só letras sem acento, números, ponto, hífen ou sublinhado, sem espaços.'
  if (login.length < 4) return 'O login deve ter pelo menos 4 caracteres.'
  if (!/[A-Za-z]/.test(login)) return 'O login precisa ter pelo menos uma letra.'
}

export function erroSenha(senha: string) {
  if (senha.length < 8 || !/[A-Za-z]/.test(senha) || !/\d/.test(senha))
    return 'A senha precisa de pelo menos 8 caracteres, com letras e números.'
}
