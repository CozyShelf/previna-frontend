import BUTTON_CLASSES from "@/types/ButtonClasses";

export interface ButtonProps {
    label: string;
    style: "default"
}

export function Button({ label, style }: ButtonProps) {
    const buttonClass = BUTTON_CLASSES[style] || BUTTON_CLASSES.default;

    return (
        <button type="button" className={buttonClass}>
            {label}
        </button>
    )
}
