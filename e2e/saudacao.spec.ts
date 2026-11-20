// Roteiro de ponta a ponta, seção 8: a saudação da tela Início segue a hora do computador. O relógio do
// navegador é fixado pelo page.clock; o portal roda no fuso America/Sao_Paulo (playwright.config.ts)
import { expect, test } from '@playwright/test'

import { ADMIN } from './apoio/ambiente'
import { hoje } from './apoio/api'
import { entrarPelaTela } from './apoio/tela'

const FUSO = 'America/Sao_Paulo'

// Ontem, na hora pedida, no fuso do navegador. Ontem porque o portal confere a validade do token pelo relógio
// do navegador: um horário no passado nunca o dá por vencido
function ontemAs(hora: number) {
  const data = hoje(-1)
  const deslocamento =
    new Intl.DateTimeFormat('en-US', { timeZone: FUSO, timeZoneName: 'longOffset' })
      .formatToParts(new Date(`${data}T12:00:00Z`))
      .find((parte) => parte.type === 'timeZoneName')
      ?.value.replace('GMT', '') || '+00:00'
  return new Date(`${data}T${String(hora).padStart(2, '0')}:00:00${deslocamento}`)
}

for (const [hora, saudacao] of [
  [9, 'Bom dia'],
  [15, 'Boa tarde'],
  [1, 'Boa noite'],
] as const) {
  test(`às ${hora}h a tela Início diz "${saudacao}"`, async ({ page }) => {
    await page.clock.setFixedTime(ontemAs(hora))
    await entrarPelaTela(page, ADMIN.login, ADMIN.senha)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(new RegExp(`^${saudacao}, `))
  })
}
