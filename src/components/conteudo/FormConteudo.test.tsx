import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FormConteudo } from './FormConteudo'
import type { Conteudo } from './tipos'

const RASCUNHO: Conteudo = {
  id: 5,
  titulo: 'Alimentação na gestação',
  categoria: 'DICA',
  tipo: 'TEXTO',
  resumo: 'Coma de tudo um pouco',
  corpo: 'Corpo do artigo',
  publicado: false,
  criadoEm: '2026-11-01T10:00:00',
}

function Lista() {
  return <p>{(useLocation().state as { mensagem: string }).mensagem}</p>
}

function renderizar(conteudo?: Conteudo) {
  render(
    <MemoryRouter initialEntries={['/form']}>
      <Routes>
        <Route path="/form" element={<FormConteudo conteudo={conteudo} />} />
        <Route path="/conteudos" element={<Lista />} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('FormConteudo', () => {
  it('exige título, categoria e tipo, sem chamar a API', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    renderizar()

    await userEvent.click(screen.getByRole('button', { name: /salvar rascunho/i }))

    expect(screen.getByText('Informe o título do conteúdo.')).toBeInTheDocument()
    expect(screen.getByText('Escolha a categoria.')).toBeInTheDocument()
    expect(screen.getByText('Escolha o tipo.')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  // Cada tipo tem o seu campo obrigatório, como no ConteudoService
  it('exige o corpo quando o tipo é Texto', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    renderizar()

    await userEvent.type(screen.getByLabelText('Título'), 'Alimentação na gestação')
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'DICA')
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'TEXTO')
    await userEvent.click(screen.getByRole('button', { name: /salvar rascunho/i }))

    expect(screen.getByText('Informe o corpo do texto.')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('exige o endereço da mídia quando o tipo é Vídeo e recusa endereço incompleto', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    renderizar()

    await userEvent.type(screen.getByLabelText('Título'), 'Trabalho de parto')
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'DICA')
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'VIDEO')
    await userEvent.click(screen.getByRole('button', { name: /salvar rascunho/i }))
    expect(screen.getByText('Informe o endereço da mídia.')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Endereço da mídia'), 'youtube.com/watch')
    await userEvent.click(screen.getByRole('button', { name: /salvar rascunho/i }))
    expect(
      screen.getByText('Informe um endereço completo, começando com http:// ou https://.'),
    ).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  // O campo de mídia só existe nos tipos que precisam dele
  it('mostra o endereço da mídia só quando o tipo usa mídia', async () => {
    renderizar()

    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'TEXTO')
    expect(screen.queryByLabelText(/endereço da/i)).not.toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'FOTO')
    expect(screen.getByLabelText('Endereço da foto')).toBeInTheDocument()
    expect(screen.getByLabelText('Imagem')).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'LINK')
    expect(screen.getByLabelText('Endereço da mídia')).toBeInTheDocument()
    expect(screen.queryByLabelText('Imagem')).not.toBeInTheDocument()
  })

  it('envia o cadastro em multipart e volta para a lista', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 201 }))
    renderizar()

    await userEvent.type(screen.getByLabelText('Título'), 'Alimentação na gestação')
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'DICA')
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'TEXTO')
    await userEvent.type(screen.getByLabelText('Corpo do texto'), 'Coma de tudo um pouco.')
    await userEvent.click(screen.getByRole('button', { name: /salvar rascunho/i }))

    expect(fetch.mock.calls[0]?.[0]).toMatch(/\/conteudos$/)
    expect(fetch.mock.calls[0]?.[1]?.method).toBe('POST')
    const corpo = fetch.mock.calls[0]?.[1]?.body as FormData
    expect(corpo.get('titulo')).toBe('Alimentação na gestação')
    expect(corpo.get('categoria')).toBe('DICA')
    expect(corpo.get('tipo')).toBe('TEXTO')
    expect(corpo.get('corpo')).toBe('Coma de tudo um pouco.')
    // Opcional em branco não vai, para ficar nulo no banco
    expect(corpo.has('resumo')).toBe(false)
    expect(corpo.has('imagem')).toBe(false)
    expect(
      await screen.findByText('Conteúdo Alimentação na gestação cadastrado com sucesso.'),
    ).toBeInTheDocument()
  })

  it('abre a edição preenchida e salva com PUT no id', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ id: 5 })))
    renderizar(RASCUNHO)

    expect(screen.getByLabelText('Título')).toHaveValue('Alimentação na gestação')
    expect(screen.getByLabelText('Categoria')).toHaveValue('DICA')
    expect(screen.getByLabelText('Tipo')).toHaveValue('TEXTO')
    expect(screen.getByLabelText('Corpo do texto')).toHaveValue('Corpo do artigo')

    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(String(fetch.mock.calls[0]?.[0])).toMatch(/\/conteudos\/5$/)
    expect(fetch.mock.calls[0]?.[1]?.method).toBe('PUT')
  })

  // Publicar é ação à parte do salvar: o conteúdo nasce rascunho
  it('publica o rascunho pela rota de publicação', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))
    renderizar(RASCUNHO)

    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }))

    expect(String(fetch.mock.calls[0]?.[0])).toMatch(/\/conteudos\/5\/publicado$/)
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({ publicado: true })
    expect(
      await screen.findByText('Conteúdo Alimentação na gestação publicado com sucesso.'),
    ).toBeInTheDocument()
  })

  it('despublica o conteúdo que já está no ar', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))
    renderizar({ ...RASCUNHO, publicado: true, publicadoEm: '2026-11-02T10:00:00' })

    await userEvent.click(screen.getByRole('button', { name: 'Despublicar' }))

    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({ publicado: false })
    expect(
      await screen.findByText('Conteúdo Alimentação na gestação despublicado com sucesso.'),
    ).toBeInTheDocument()
  })

  it('exclui o conteúdo e volta para a lista', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))
    renderizar(RASCUNHO)

    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    expect(fetch.mock.calls[0]?.[1]?.method).toBe('DELETE')
    expect(String(fetch.mock.calls[0]?.[0])).toMatch(/\/conteudos\/5$/)
    expect(
      await screen.findByText('Conteúdo Alimentação na gestação excluído com sucesso.'),
    ).toBeInTheDocument()
  })

  // Com uma foto já salva, não é preciso reenviar o arquivo nem digitar endereço
  it('aceita salvar a foto já guardada sem arquivo novo', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))
    renderizar({
      ...RASCUNHO,
      tipo: 'FOTO',
      corpo: undefined,
      midiaUrl: '/conteudos/5/imagem?v=1',
    })

    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(fetch.mock.calls[0]?.[1]?.method).toBe('PUT')
    const corpo = fetch.mock.calls[0]?.[1]?.body as FormData
    expect(corpo.has('midiaUrl')).toBe(false)
    expect(corpo.has('imagem')).toBe(false)
  })

  it('mostra o erro do servidor sem sair da tela', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 400 }))
    renderizar(RASCUNHO)

    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O servidor não aceitou os dados ou a imagem. Confira os campos e tente novamente.',
    )
  })
})
