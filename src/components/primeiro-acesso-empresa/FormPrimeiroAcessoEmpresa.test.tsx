import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FormPrimeiroAcessoEmpresa } from './FormPrimeiroAcessoEmpresa'

function renderizar() {
  render(
    <MemoryRouter initialEntries={['/primeiro-acesso']}>
      <Routes>
        <Route path="/primeiro-acesso" element={<FormPrimeiroAcessoEmpresa />} />
        <Route path="/tutorial" element={<p>Tutorial</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

// Sem filtrar pelo accept do input, para testar a validação do tipo
const usuario = userEvent.setup({ applyAccept: false })

async function preencher(confirmacao: string, logo?: File) {
  await usuario.type(screen.getByLabelText('Novo login'), 'bemnascer')
  await usuario.type(screen.getByLabelText('Nova senha'), 'senhaNova1')
  await usuario.type(screen.getByLabelText('Confirme a nova senha'), confirmacao)
  await usuario.type(screen.getByLabelText('Segmento'), 'Farmácia')
  await usuario.type(screen.getByLabelText('Endereço'), 'Rua das Flores, 100')
  if (logo) await usuario.upload(screen.getByLabelText('Logo'), logo)
  await usuario.click(screen.getByRole('button', { name: /salvar e continuar/i }))
}

const imagem = (tipo: string, bytes = 10) =>
  new File([new Uint8Array(bytes)], 'logo', { type: tipo })

// Lacunas do jsdom: URLs temporárias da pré-visualização e o FormData não enxerga
// o arquivo escolhido pelo userEvent.upload (no navegador ele entra no formulário)
const FormDataOriginal = FormData
class FormDataComArquivos extends FormDataOriginal {
  constructor(form?: HTMLFormElement) {
    super(form)
    form?.querySelectorAll<HTMLInputElement>('input[type=file]').forEach((input) => {
      if (input.files?.[0]) this.set(input.name, input.files[0])
    })
  }
}

beforeEach(() => {
  vi.stubGlobal('FormData', FormDataComArquivos)
  URL.createObjectURL = vi.fn(() => 'blob:logo')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('FormPrimeiroAcessoEmpresa', () => {
  it('recusa a confirmação diferente da nova senha', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    renderizar()

    await preencher('outraSenha2')

    expect(screen.getByText('As senhas não conferem.')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each([
    [imagem('image/gif'), 'Escolha uma imagem PNG, JPG ou WebP.'],
    [imagem('image/png', 2 * 1024 * 1024 + 1), 'A imagem deve ter no máximo 2 MB.'],
  ])('recusa logo fora do tipo ou do tamanho', async (logo, mensagem) => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    renderizar()

    await preencher('senhaNova1', logo)

    expect(screen.getByText(mensagem)).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('envia o logo junto, guarda o novo token e segue para o tutorial', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ token: 'novo-token', primeiroAcesso: false })),
      )
    renderizar()

    await preencher('senhaNova1', imagem('image/png'))

    expect(await screen.findByText('Tutorial')).toBeInTheDocument()
    expect(localStorage.getItem('previna.token')).toBe('novo-token')
    const corpo = fetch.mock.calls[0]?.[1]?.body as FormData
    expect(corpo.get('novoLogin')).toBe('bemnascer')
    expect(corpo.get('logo')).toBeInstanceOf(File)
    expect(corpo.has('confirmacao')).toBe(false)
    expect(screen.queryByRole('img', { name: 'Pré-visualização' })).not.toBeInTheDocument()
  })

  it('mostra a pré-visualização do logo escolhido', async () => {
    renderizar()

    await usuario.upload(screen.getByLabelText('Logo'), imagem('image/png'))

    expect(screen.getByRole('img', { name: 'Pré-visualização' })).toHaveAttribute(
      'src',
      'blob:logo',
    )
  })
})
