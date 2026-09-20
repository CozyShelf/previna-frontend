import PrevinaLogo from "@/components/atendente-login/PrevinaAtendenteLogo";
import { FormLoginAtendente } from "@/components/atendente-login/FormLoginAtendente";

export function HomePage() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-8 sm:gap-10">
      <PrevinaLogo />
      <FormLoginAtendente />
    </section>
  )
}
