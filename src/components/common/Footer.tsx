export interface FooterProps {
    text?: string;
}

export function Footer({ text }: FooterProps) {
    return (
        <footer className="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-500 sm:px-6">
            {text || "Previna — acompanhamento de pré-natal"}
        </footer>
    )
}
