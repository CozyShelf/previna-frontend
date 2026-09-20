export interface AnchorProps {
    href: string;
    label: string;
    additionalText?: string;
    className?: string;
}

export function Anchor({ href, label, className = "", additionalText }: AnchorProps) {
    return (
        <p className="flex flex-wrap items-center justify-center gap-x-1 text-center text-sm">
            {additionalText && <span>{additionalText}</span>}

            <a href={href} className={`text-previna font-bold ${className}`}>
                {label}
            </a>
        </p>
    )
}
