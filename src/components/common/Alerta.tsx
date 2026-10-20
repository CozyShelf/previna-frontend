import { Icone } from './Icone'

export interface AlertaProps {
  mensagem: string
}

export function Alerta({ mensagem }: AlertaProps) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      <Icone nome="alerta" className="mt-0.5 size-4 shrink-0" />
      {mensagem}
    </p>
  )
}
