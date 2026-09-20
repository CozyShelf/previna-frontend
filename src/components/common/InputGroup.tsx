import { useId } from "react";

export interface InputGroupProps {
    labelTxt: string;
    placeholder: string;
}

export function InputGroup({ labelTxt, placeholder }: InputGroupProps) {
    const inputId = useId();

    return (
        <div className="flex w-full flex-col gap-2">
            <label htmlFor={inputId} className="text-sm font-bold text-gray-700">
                {labelTxt}
            </label>
            <input
                id={inputId}
                type="text"
                placeholder={placeholder}
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-base placeholder:text-sm focus:ring-previna focus:outline-none focus:ring-2"
            />
        </div>
    )
}
