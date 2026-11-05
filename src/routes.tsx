import { createBrowserRouter } from 'react-router-dom'

import { RotaProtegida } from '@/components/RotaProtegida'
import type { HandleRota } from '@/components/sistema/Trilha'
import { AppLayout } from '@/layouts/AppLayout'
import { SistemaLayout } from '@/layouts/SistemaLayout'
import { CadastroCupomPage } from '@/pages/CadastroCupomPage'
import { CadastroPromocaoPage } from '@/pages/CadastroPromocaoPage'
import { ConteudoPage } from '@/pages/ConteudoPage'
import { ConteudosPage } from '@/pages/ConteudosPage'
import { CuponsPage } from '@/pages/CuponsPage'
import { EmpresasPage } from '@/pages/EmpresasPage'
import { CadastroAgendamentoPage } from '@/pages/CadastroAgendamentoPage'
import { GestantePage } from '@/pages/GestantePage'
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
import { ProdutoPage } from '@/pages/ProdutoPage'
import { ProdutosPage } from '@/pages/ProdutosPage'
import { PromocoesPage } from '@/pages/PromocoesPage'
import { TipoAtendimentoPage } from '@/pages/TipoAtendimentoPage'
import { TiposAtendimentoPage } from '@/pages/TiposAtendimentoPage'
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
              { path: ':id', element: <GestantePage />, handle: titulo('Gestante') },
              {
                path: ':id/agendamentos/novo',
                element: <CadastroAgendamentoPage />,
                handle: titulo('Novo exame ou consulta'),
              },
            ],
          },
          {
            path: 'tipos-atendimento',
            handle: titulo('Tipos de atendimento'),
            children: [
              { index: true, element: <TiposAtendimentoPage /> },
              { path: 'novo', element: <TipoAtendimentoPage />, handle: titulo('Cadastro') },
              { path: ':id', element: <TipoAtendimentoPage />, handle: titulo('Edição') },
            ],
          },
          {
            path: 'conteudos',
            handle: titulo('Conteúdo educativo'),
            children: [
              { index: true, element: <ConteudosPage /> },
              { path: 'novo', element: <ConteudoPage />, handle: titulo('Cadastro') },
              { path: ':id', element: <ConteudoPage />, handle: titulo('Edição') },
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
          {
            path: 'produtos',
            handle: titulo('Produtos'),
            children: [
              { index: true, element: <ProdutosPage /> },
              { path: 'novo', element: <ProdutoPage />, handle: titulo('Cadastro') },
              { path: ':id', element: <ProdutoPage />, handle: titulo('Edição') },
            ],
          },
          {
            path: 'promocoes',
            handle: titulo('Promoções'),
            children: [
              { index: true, element: <PromocoesPage /> },
              { path: 'novo', element: <CadastroPromocaoPage />, handle: titulo('Cadastro') },
            ],
          },
          {
            path: 'cupons',
            handle: titulo('Cupons'),
            children: [
              { index: true, element: <CuponsPage /> },
              { path: 'novo', element: <CadastroCupomPage />, handle: titulo('Cadastro') },
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
