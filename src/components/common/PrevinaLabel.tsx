export interface PrevinaLabelProps {
    labelTxt?: string;
    className?: string;
}

export function PrevinaLabel({ labelTxt, className = "" }: PrevinaLabelProps) {
    return (
        <h1 className={`text-previna text-balance text-center text-2xl font-bold sm:text-3xl ${className}`}>
            {labelTxt || "Previna"}
        </h1>
    )
}
