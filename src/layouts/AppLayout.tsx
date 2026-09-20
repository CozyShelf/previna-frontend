import { Outlet } from 'react-router-dom'

import { Footer } from '@/components/common/Footer'
import { MainHeader } from '@/components/common/Header'

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <MainHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:py-12">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
