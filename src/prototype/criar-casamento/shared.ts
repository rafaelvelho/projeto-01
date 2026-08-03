/** PROTOTYPE shared types/constants — avoid circular imports between variants */

export type CriarCasamentoDraft = {
  nome: string
  data: string
  descricaoRomantica: string
  senhaCasamento: string
  codigoNoivos: string
}

export type CriarCasamentoResult = CriarCasamentoDraft & {
  slugPrivado: string
  linkPrivado: string
}

export const SUGSTOES_DESCRICAO = [
  'Dois corações, uma história — e um álbum feito por quem esteve lá.',
  'Obrigado por celebrar conosco. Deixe um pedaço deste dia em fotos.',
  'Que cada clique guarde um sorriso deste dia inesquecível.',
]

function slugify(nome: string) {
  const base = nome
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return base || 'casamento'
}

export function buildResult(draft: CriarCasamentoDraft): CriarCasamentoResult {
  const slugPrivado = `${slugify(draft.nome) || 'casamento'}-privado`
  return {
    ...draft,
    slugPrivado,
    linkPrivado: `${window.location.origin}/p/${slugPrivado}`,
  }
}

/** Handles normal and over-encoded query strings (?prototype%3D...) */
export function readPrototypeSearch(search = window.location.search) {
  let raw = search.startsWith('?') ? search.slice(1) : search
  try {
    raw = decodeURIComponent(raw)
  } catch {
    /* keep raw */
  }
  const params = new URLSearchParams(raw)
  const prototype = params.get('prototype')
  const variant = params.get('variant')
  return { prototype, variant, isCriarCasamento: prototype === 'criar-casamento' }
}
