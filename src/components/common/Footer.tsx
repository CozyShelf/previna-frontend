export interface FooterProps {
  text?: string
}

export function Footer({ text }: FooterProps) {
  return (
    <footer className="border-t border-zinc-200 px-6 py-4 text-center text-xs text-zinc-500">
      {text || 'Previna — acompanhamento de pré-natal'}
    </footer>
  )
}
