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
