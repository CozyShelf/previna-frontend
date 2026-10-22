import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/common/Button'
import { Icone, type NomeIcone } from '@/components/common/Icone'
import { PageHeader } from '@/components/sistema/PageHeader'

interface Etapa {
  titulo: string
  descricao: string
  icone: NomeIcone
}

const ETAPAS: Etapa[] = [
  {
    titulo: 'Cadastre seus produtos',
    descricao:
      'Inclua os produtos da sua empresa com nome, descrição, categoria, preço e foto. Eles ficam visíveis para as gestantes do programa.',
    icone: 'produto',
  },
  {
    titulo: 'Crie promoções',
    descricao:
      'Escolha os produtos participantes, defina o desconto e o período em que a promoção vale.',
    icone: 'promocao',
  },
  {
    titulo: 'Ofereça cupons',
    descricao:
      'Crie cupons para um produto ou uma promoção, com a quantidade disponível, a validade e quantos pontos a gestante precisa para resgatar.',
    icone: 'cupom',
  },
  {
    titulo: 'Valide os cupons resgatados',
    descricao:
      'As gestantes ganham pontos indo às consultas de pré-natal e trocam por seus cupons. Na hora da compra, confira o código do cupom no portal para registrar o uso.',
    icone: 'validar',
  },
]

export function TutorialEmpresaPage() {
  const navigate = useNavigate()
  const [indice, setIndice] = useState(0)
  const etapa = ETAPAS[indice]!
  const ultima = indice === ETAPAS.length - 1

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <PageHeader
        titulo="Boas-vindas ao Previna"
        descricao="Veja como sua empresa participa do programa de incentivo ao pré-natal."
      />

      <section className="flex flex-col gap-6 rounded-lg border border-zinc-200 bg-white p-8">
        <div aria-hidden="true" className="flex gap-2">
          {ETAPAS.map((item, i) => (
            <span
              key={item.titulo}
              className={`h-1.5 flex-1 rounded-full ${i <= indice ? 'bg-previna-600' : 'bg-zinc-200'}`}
            />
          ))}
        </div>

        <div aria-live="polite" className="flex flex-col gap-4">
          <span className="flex size-12 items-center justify-center rounded-full bg-previna-50 text-previna-600">
            <Icone nome={etapa.icone} className="size-6" />
          </span>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wide text-previna-600 uppercase">
              Etapa {indice + 1} de {ETAPAS.length}
            </p>
            <h2 className="text-lg font-semibold text-zinc-900">{etapa.titulo}</h2>
            <p className="text-zinc-600">{etapa.descricao}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          {indice > 0 && (
            <Button label="Voltar" style="secondary" onClick={() => setIndice(indice - 1)} />
          )}
          <Button
            label={ultima ? 'Ir para o painel' : 'Próximo'}
            style="primary"
            onClick={() => (ultima ? navigate('/', { replace: true }) : setIndice(indice + 1))}
          />
        </div>
      </section>
    </div>
  )
}
