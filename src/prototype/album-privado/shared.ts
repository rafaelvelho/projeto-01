/** PROTOTYPE — album privado shared state helpers */

export type FakePhoto = {
  id: string
  name: string
  url: string
  addedBy: 'convidado' | 'noivos'
}

export type AlbumDemoState = {
  unlocked: boolean
  modoNoivos: boolean
  tab: 'enviar' | 'album'
  photos: FakePhoto[]
  congelado: boolean
  publicado: boolean
  nome: string
  dataLabel: string
  descricao: string
}

export const DEMO = {
  senha: 'casamento',
  codigoNoivos: 'noivos',
  nome: 'Ana & João',
  dataLabel: '15 de novembro de 2026',
  descricao:
    'Dois corações, uma história — e um álbum feito por quem esteve lá.',
}

export function initialAlbumState(): AlbumDemoState {
  return {
    unlocked: false,
    modoNoivos: false,
    tab: 'enviar',
    photos: [],
    congelado: false,
    publicado: false,
    nome: DEMO.nome,
    dataLabel: DEMO.dataLabel,
    descricao: DEMO.descricao,
  }
}

export function fileToFakePhoto(
  file: File,
  addedBy: 'convidado' | 'noivos',
): FakePhoto {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    url: URL.createObjectURL(file),
    addedBy,
  }
}

/** Handles normal and over-encoded query strings */
export function readAlbumPrototypeSearch(search = window.location.search) {
  let raw = search.startsWith('?') ? search.slice(1) : search
  try {
    raw = decodeURIComponent(raw)
  } catch {
    /* keep */
  }
  const params = new URLSearchParams(raw)
  return {
    prototype: params.get('prototype'),
    variant: params.get('variant'),
    isAlbumPrivado: params.get('prototype') === 'album-privado',
  }
}
