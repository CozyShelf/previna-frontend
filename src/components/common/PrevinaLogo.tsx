import logo from '@/assets/images/logo.png'

export default function PrevinaLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <img src={logo} alt="" className="size-7" />
      <span className="font-brand text-lg font-bold text-previna-600">Previna</span>
    </div>
  )
}
