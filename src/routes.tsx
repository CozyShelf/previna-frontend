import { createBrowserRouter } from 'react-router-dom'

import { RotaProtegida } from '@/components/RotaProtegida'
import type { HandleRota } from '@/components/sistema/Trilha'
import { AppLayout } from '@/layouts/AppLayout'
import { SistemaLayout } from '@/layouts/SistemaLayout'
import { EmpresasPage } from '@/pages/EmpresasPage'
import { GestantesPage } from '@/pages/GestantesPage'
import { InicioPage } from '@/pages/InicioPage'
import { LoginPage } from '@/pages/LoginPage'
import { MedicoPage } from '@/pages/MedicoPage'
import { MedicosPage } from '@/pages/MedicosPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PerfilPage } from '@/pages/PerfilPage'
import { PreCadastroEmpresaPage } from '@/pages/PreCadastroEmpresaPage'
import { PreCadastroGestantePage } from '@/pages/PreCadastroGestantePage'
import { PrimeiroAcessoEmpresaPage } from '@/pages/PrimeiroAcessoEmpresaPage'
import { TutorialEmpresaPage } from '@/pages/TutorialEmpresaPage'

const titulo = (texto: string): HandleRota => ({ titulo: texto })

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
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
          {
            path: 'empresas',
            handle: titulo('Empresas parceiras'),
            children: [
              { index: true, element: <EmpresasPage /> },
              {
                path: 'pre-cadastro',
                element: <PreCadastroEmpresaPage />,
                handle: titulo('Pré-cadastro'),
              },
            ],
          },
          {
            path: 'medicos',
            handle: titulo('Médicos'),
            children: [
              { index: true, element: <MedicosPage /> },
              { path: 'novo', element: <MedicoPage />, handle: titulo('Cadastro') },
              { path: ':id', element: <MedicoPage />, handle: titulo('Edição') },
            ],
          },
          { path: 'perfil', element: <PerfilPage />, handle: titulo('Meu perfil') },
        ],
      },
      {
        element: <AppLayout />,
        children: [{ path: '/tutorial', element: <TutorialEmpresaPage /> }],
      },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      // Fora da RotaProtegida, que redireciona para cá quem ainda usa a senha temporária
      { path: '/primeiro-acesso', element: <PrimeiroAcessoEmpresaPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
