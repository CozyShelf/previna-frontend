import type { FormEvent, ReactNode } from 'react'

export interface FormProps {
  onSubmit: (dados: FormData) => void
  children: ReactNode
  className?: string
  noValidate?: boolean
}

export function Form({ onSubmit, children, className, noValidate }: FormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(new FormData(event.currentTarget))
  }

  return (
    <form onSubmit={handleSubmit} className={className} noValidate={noValidate}>
      {children}
    </form>
  )
}
