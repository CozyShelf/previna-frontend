import { Anchor, type AnchorProps } from "./Anchor";
import { Button } from "./Button";
import { InputGroup, type InputGroupProps } from "./InputGroup";

export interface FormProps {
    inputs: InputGroupProps[];
    onSubmit: () => void;
    additionalLinks?: AnchorProps[];
    className?: string;
}

export function Form({ inputs, onSubmit, additionalLinks, className }: FormProps) {
    return (
        <form onSubmit={onSubmit} className={className}>
            {inputs.map((input) => {
                return <InputGroup key={input.labelTxt} {...input} />;
            })}

            {additionalLinks && (
                <div className="flex flex-col gap-2 text-sm text-gray-700">
                    {additionalLinks.map((link) => {
                        return (
                            <div key={link.href} className="flex justify-center pt-2">
                                <Anchor {...link} />
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex justify-center pt-2">
                <Button label="Entrar" style="default" />
            </div>
        </form>
    )
}
