import type { PropsCampo } from '@/hooks/useValidacao'
import { TIPOS_IMAGEM } from '@/lib/validacoes'
import { InputGroup } from '../common/InputGroup'
import { InputImagem } from '../common/InputImagem'
import { SecaoFormulario } from '../common/SecaoFormulario'

export interface SecaoSobreEmpresaProps {
  campo: (nome: 'segmento' | 'endereco' | 'logo') => PropsCampo
  // Dados já salvos, ao editar pelo perfil
  valores?: { segmento?: string; endereco?: string; descricao?: string; logo?: string }
}

// Dados que as gestantes veem, preenchidos no primeiro acesso e editáveis no perfil
export function SecaoSobreEmpresa({ campo, valores }: SecaoSobreEmpresaProps) {
  return (
    <SecaoFormulario
      titulo="Sobre a empresa"
      descricao="As gestantes veem esses dados junto com seus produtos, promoções e cupons."
    >
      <InputGroup
        labelTxt="Segmento"
        {...campo('segmento')}
        defaultValue={valores?.segmento}
        placeholder="Ex.: farmácia, moda gestante, artigos infantis"
        maxLength={50}
        required
        className="col-span-2"
      />
      <InputGroup
        labelTxt="Endereço"
        {...campo('endereco')}
        defaultValue={valores?.endereco}
        autoComplete="street-address"
        maxLength={255}
        required
        className="col-span-2"
      />
      <InputGroup
        labelTxt="Descrição"
        name="descricao"
        defaultValue={valores?.descricao}
        hint="Opcional"
        maxLength={1000}
        className="col-span-2"
      />
      <InputImagem
        labelTxt="Logo"
        {...campo('logo')}
        atual={valores?.logo}
        nomeRemover="removerLogo"
        accept={TIPOS_IMAGEM.join(',')}
        hint="Opcional"
        descricao="PNG, JPG ou WebP, com até 2 MB."
        className="col-span-2"
      />
    </SecaoFormulario>
  )
}
