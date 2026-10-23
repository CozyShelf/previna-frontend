export interface Passo {
  titulo: string
  texto: string
}

export interface ComoFuncionaProps {
  passos: Passo[]
}

// Estado vazio das listas: explica o pré-cadastro enquanto ainda não há ninguém cadastrado
export function ComoFunciona({ passos }: ComoFuncionaProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6">
      <h2 className="font-semibold text-zinc-900">Como funciona o pré-cadastro</h2>
      <ol className="mt-5 grid grid-cols-3 gap-8">
        {passos.map((passo, indice) => (
          <li key={passo.titulo} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
              {indice + 1}
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="font-medium text-zinc-900">{passo.titulo}</p>
              <p className="text-zinc-600">{passo.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
