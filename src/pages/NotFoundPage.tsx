import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-md space-y-3 text-center">
      <h1 className="text-xl font-bold sm:text-2xl">Página não encontrada</h1>
      <Link to="/" className="text-previna underline">
        Voltar para o início
      </Link>
    </section>
  )
}
