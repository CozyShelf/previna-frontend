const digitos = (valor: string, max: number) => valor.replace(/\D/g, '').slice(0, max)

export const somenteDigitos = (valor: FormDataEntryValue | null) =>
  String(valor ?? '').replace(/\D/g, '')

// 12345678901 -> 123.456.789-01, formatando aos poucos enquanto digita
export function mascararCpf(valor: string) {
  return digitos(valor, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

// 10 dígitos -> (11) 2345-6789; 11 dígitos -> (11) 98765-4321
export function mascararTelefone(valor: string) {
  return digitos(valor, 11)
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
}

// 12345678000195 -> 12.345.678/0001-95, formatando aos poucos enquanto digita
export function mascararCnpj(valor: string) {
  return digitos(valor, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}
