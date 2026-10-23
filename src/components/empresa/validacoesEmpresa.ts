import { somenteDigitos } from '@/lib/mascaras'
import { erroEmail, erroImagem } from '@/lib/validacoes'

// Regras dos dados da empresa parceira, as mesmas dos requests do backend, na ordem dos formulários
export const VALIDACOES_EMPRESA = {
  responsavel: (valor: string) => (valor.trim() ? undefined : 'Informe o nome do responsável.'),
  email: (valor: string) => (valor ? erroEmail(valor) : 'Informe o e-mail.'),
  telefone: (valor: string) => {
    const telefone = somenteDigitos(valor)
    if (!telefone) return 'Informe o telefone.'
    if (telefone.length < 10) return 'Informe o DDD e o número, com 10 ou 11 dígitos.'
  },
  segmento: (valor: string) => (valor.trim() ? undefined : 'Informe o segmento da empresa.'),
  endereco: (valor: string) => (valor.trim() ? undefined : 'Informe o endereço.'),
  logo: (_: string, dados: FormData) => erroImagem(dados.get('logo')),
}
