export type CasamentoPublico = {
  id: string
  nome: string
  data: string
  descricaoRomantica: string
  slugPrivado: string
  slugPublico: string
  publicado: boolean
  congelado: boolean
  congeladoEm: string | null
}

export type FotoItem = {
  id: string
  url: string
  createdAt: string
}

export type Papel = 'convidado' | 'noivos'

type JsonResponse = Record<string, unknown> & {
  error?: string
}

function baseUrl() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  if (!url || !/^https?:\/\//.test(url) || !url.includes('supabase')) {
    throw new Error(
      'Supabase não configurado no build (VITE_SUPABASE_URL). Redeploy com as env vars na Vercel.',
    )
  }
  return `${url.replace(/\/$/, '')}/functions/v1/album`
}

function anonKey() {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!key) throw new Error('VITE_SUPABASE_ANON_KEY ausente')
  return key
}

async function parseJson(res: Response): Promise<JsonResponse> {
  const body = (await res.json().catch(() => ({}))) as JsonResponse
  if (!res.ok) {
    throw new Error(body.error || `Erro ${res.status}`)
  }
  if (body.error) throw new Error(body.error)
  return body
}

export async function albumAction<T extends JsonResponse>(
  action: string,
  payload: Record<string, unknown> = {},
  token?: string | null,
  accessToken?: string | null,
): Promise<T> {
  const bearer = accessToken || anonKey()
  const res = await fetch(baseUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey(),
      Authorization: `Bearer ${bearer}`,
      ...(token ? { 'x-album-token': token } : {}),
    },
    body: JSON.stringify({ action, ...payload }),
  })
  return (await parseJson(res)) as T
}

export async function albumUpload(file: File, token: string) {
  const form = new FormData()
  form.set('action', 'upload')
  form.set('file', file)
  const res = await fetch(baseUrl(), {
    method: 'POST',
    headers: {
      apikey: anonKey(),
      Authorization: `Bearer ${anonKey()}`,
      'x-album-token': token,
    },
    body: form,
  })
  return parseJson(res) as Promise<{ foto: FotoItem }>
}

export function sessionKey(slugPrivado: string) {
  return `album-session:${slugPrivado}`
}

export function readSession(slugPrivado: string): {
  token: string
  papel: Papel
} | null {
  try {
    const raw = sessionStorage.getItem(sessionKey(slugPrivado))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { token?: string; papel?: Papel }
    if (!parsed.token || !parsed.papel) return null
    return { token: parsed.token, papel: parsed.papel }
  } catch {
    return null
  }
}

export function writeSession(
  slugPrivado: string,
  token: string,
  papel: Papel,
) {
  sessionStorage.setItem(
    sessionKey(slugPrivado),
    JSON.stringify({ token, papel }),
  )
}

export function clearSession(slugPrivado: string) {
  sessionStorage.removeItem(sessionKey(slugPrivado))
}

export function formatDataCasamento(isoDate: string) {
  try {
    return new Date(isoDate + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return isoDate
  }
}

export function linkPrivado(slug: string) {
  return `${window.location.origin}/p/${slug}`
}

export function linkPublico(slug: string) {
  return `${window.location.origin}/a/${slug}`
}

export type PainelResumo = {
  casamento: CasamentoPublico | null
  fotosCount: number
  bytesTotal: number
}

export async function fetchMinePainel(
  accessToken: string,
): Promise<PainelResumo> {
  return albumAction<PainelResumo & Record<string, unknown>>(
    'mine_painel',
    {},
    null,
    accessToken,
  )
}

/** Um álbum por conta: caminho do privado ou /criar se ainda não existir. */
export async function pathDoMeuAlbum(accessToken: string): Promise<string> {
  const res = await albumAction<{ casamentos: CasamentoPublico[] }>(
    'list_mine',
    {},
    null,
    accessToken,
  )
  const primeiro = res.casamentos[0]
  if (!primeiro) return '/criar'
  return `/p/${primeiro.slugPrivado}`
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB'
  const gb = bytes / 1024 ** 3
  if (gb >= 1) {
    const n = gb >= 10 ? gb.toFixed(0) : gb.toFixed(2)
    return `${n.replace('.', ',')} GB`
  }
  const mb = bytes / 1024 ** 2
  if (mb >= 0.1) {
    const n = mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)
    return `${n.replace('.', ',')} MB`
  }
  const kb = bytes / 1024
  return `${Math.max(1, Math.round(kb))} KB`
}
