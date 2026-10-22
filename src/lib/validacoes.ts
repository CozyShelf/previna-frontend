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
