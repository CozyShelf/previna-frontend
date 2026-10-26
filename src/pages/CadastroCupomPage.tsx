import { FormCupom } from '@/components/cupom/FormCupom'
import { PageHeader } from '@/components/sistema/PageHeader'

export function CadastroCupomPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Cadastrar cupom"
        descricao="Escolha o produto e defina o desconto, a validade e os pontos para resgatar."
      />
      <FormCupom />
    </div>
  )
}
