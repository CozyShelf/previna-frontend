import logo from '@/assets/images/logo.png'
import { PrevinaLabel } from '../common/PrevinaLabel'

export default function PrevinaLogo() {
    return (
        <div className="flex w-full flex-col items-center gap-2">
            <img src={logo} alt="Previna" className="h-auto w-24 max-w-full sm:w-32" />
            <PrevinaLabel labelTxt="Previna - Login Atendente" className="text-xl sm:text-2xl" />
        </div>
    )
}
