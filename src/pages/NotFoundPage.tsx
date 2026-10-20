import { Link } from 'react-router-dom'

import BUTTON_CLASSES from '@/types/ButtonClasses'

export function NotFoundPage() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
      <h1 className="text-xl font-semibold">Página não encontrada</h1>
      <p className="text-zinc-600">O endereço acessado não existe no Previna.</p>
      <Link to="/" className={BUTTON_CLASSES.secondary}>
        Voltar para o início
      </Link>
    </section>
  )
}
