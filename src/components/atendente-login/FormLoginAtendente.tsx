import type { AnchorProps } from "../common/Anchor";
import { Form } from "../common/Form";
import type { InputGroupProps } from "../common/InputGroup";

export function FormLoginAtendente() {
    const inputs: InputGroupProps[] = [
    {
      labelTxt: "Nome completo da Atendente",
      placeholder: "Digite o nome completo da atendente",
    },
    {
      labelTxt: "Senha da Atendente",
      placeholder: "Digite a senha da atendente",
    }
  ];

  const additionalLinks: AnchorProps[] = [
    {
      href: "/recuperar-senha",
      label: "Esqueceu a Senha ?",
    }
  ]

    return (
        <Form 
            inputs={inputs} 
            onSubmit={() => {}} 
            additionalLinks={additionalLinks}
            className="flex w-full flex-col gap-4 sm:gap-5" />
    )
}
