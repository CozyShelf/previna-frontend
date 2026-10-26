import { FormPromocao } from '@/components/promocao/FormPromocao'
import { PageHeader } from '@/components/sistema/PageHeader'

export function CadastroPromocaoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Cadastrar promoção"
        descricao="Escolha a categoria, o desconto e o período em que a promoção vale. Ela alcança todos os produtos da empresa nessa categoria."
      />
      <FormPromocao />
    </div>
  )
}
