import { createBrowserRouter } from 'react-router-dom'

import { RotaProtegida } from '@/components/RotaProtegida'
import type { HandleRota } from '@/components/sistema/Trilha'
import { AppLayout } from '@/layouts/AppLayout'
import { SistemaLayout } from '@/layouts/SistemaLayout'
import { GestantesPage } from '@/pages/GestantesPage'
import { InicioPage } from '@/pages/InicioPage'
import { MedicoLoginPage } from '@/pages/MedicoLoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PerfilPage } from '@/pages/PerfilPage'
import { PreCadastroGestantePage } from '@/pages/PreCadastroGestantePage'

const titulo = (texto: string): HandleRota => ({ titulo: texto })

export const router = createBrowserRouter([
  { path: '/login', element: <MedicoLoginPage /> },
  {
    element: <RotaProtegida />,
    children: [
      {
        path: '/',
        element: <SistemaLayout />,
        handle: titulo('Início'),
        children: [
          { index: true, element: <InicioPage /> },
          {
            path: 'gestantes',
            handle: titulo('Gestantes'),
            children: [
              { index: true, element: <GestantesPage /> },
              {
                path: 'pre-cadastro',
                element: <PreCadastroGestantePage />,
                handle: titulo('Pré-cadastro'),
              },
            ],
          },
          { path: 'perfil', element: <PerfilPage />, handle: titulo('Meu perfil') },
        ],
      },
    ],
  },
  {
    element: <AppLayout />,
    children: [{ path: '*', element: <NotFoundPage /> }],
  },
])
