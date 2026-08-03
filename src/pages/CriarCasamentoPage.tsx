import { useMemo, useState } from 'react'
import {
  albumAction,
  linkPrivado,
  linkPublico,
  type CasamentoPublico,
} from '../lib/album-api'
import '../prototype/criar-casamento/criar-casamento.css'

const SUGSTOES = [
  'Dois corações, uma história — e um álbum feito por quem esteve lá.',
  'Obrigado por celebrar conosco. Deixe um pedaço deste dia em fotos.',
  'Que cada clique guarde um sorriso deste dia inesquecível.',
]

type Draft = {
  nome: string
  data: string
  descricaoRomantica: string
  senhaCasamento: string
  codigoNoivos: string
}

const empty: Draft = {
  nome: '',
  data: '',
  descricaoRomantica: SUGSTOES[2],
  senhaCasamento: '',
  codigoNoivos: '',
}

export function CriarCasamentoPage() {
  const [draft, setDraft] = useState(empty)
  const [sugIdx, setSugIdx] = useState(2)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [casamento, setCasamento] = useState<CasamentoPublico | null>(null)
  const [copied, setCopied] = useState<'privado' | 'publico' | null>(null)

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  const dataFmt = useMemo(() => {
    if (!draft.data) return 'Data do casamento'
    try {
      return new Date(draft.data + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return draft.data
    }
  }, [draft.data])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const res = await albumAction<{ casamento: CasamentoPublico }>('create', {
        ...draft,
      })
      setCasamento(res.casamento)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao criar')
    } finally {
      setLoading(false)
    }
  }

  function cycleSuggestion() {
    const next = (sugIdx + 1) % SUGSTOES.length
    setSugIdx(next)
    update('descricaoRomantica', SUGSTOES[next])
  }

  async function copy(kind: 'privado' | 'publico') {
    if (!casamento) return
    const url =
      kind === 'privado'
        ? linkPrivado(casamento.slugPrivado)
        : linkPublico(casamento.slugPublico)
    await navigator.clipboard.writeText(url)
    setCopied(kind)
  }

  return (
    <div className="proto-criar-root">
      <div className="vc-page">
        <section className="vc-form-pane">
          <p className="vc-brand">Álbum coletivo</p>
          <h1>Montar o álbum</h1>
          <form onSubmit={submit}>
            <label>
              Nome
              <input
                value={draft.nome}
                onChange={(e) => update('nome', e.target.value)}
                placeholder="Ana & João"
                required
              />
            </label>
            <label>
              Data
              <input
                type="date"
                value={draft.data}
                onChange={(e) => update('data', e.target.value)}
                required
              />
            </label>
            <label>
              Descrição
              <textarea
                rows={4}
                value={draft.descricaoRomantica}
                onChange={(e) => update('descricaoRomantica', e.target.value)}
              />
            </label>
            <button type="button" className="vc-linkish" onClick={cycleSuggestion}>
              Outra sugestão romântica
            </button>
            <label>
              Senha do casamento
              <input
                type="password"
                value={draft.senhaCasamento}
                onChange={(e) => update('senhaCasamento', e.target.value)}
                required
              />
            </label>
            <label>
              Código dos noivos
              <input
                type="password"
                value={draft.codigoNoivos}
                onChange={(e) => update('codigoNoivos', e.target.value)}
                required
              />
            </label>
            {erro && (
              <p style={{ color: '#a61b1b', margin: '0.35rem 0' }}>{erro}</p>
            )}
            <button type="submit" disabled={loading}>
              {loading ? 'Criando…' : 'Criar e gerar links'}
            </button>
          </form>

          {casamento && (
            <div className="vc-done">
              <p>Casamento criado. Guarde os links:</p>
              <code>{linkPrivado(casamento.slugPrivado)}</code>
              <button type="button" onClick={() => copy('privado')}>
                {copied === 'privado' ? 'Copiado' : 'Copiar link privado'}
              </button>
              <code>{linkPublico(casamento.slugPublico)}</code>
              <button type="button" onClick={() => copy('publico')}>
                {copied === 'publico' ? 'Copiado' : 'Copiar link público'}
              </button>
              <p>
                O link público só funciona depois que os noivos publicarem o
                álbum.
              </p>
              <a href={linkPrivado(casamento.slugPrivado)}>Abrir link privado</a>
            </div>
          )}
        </section>

        <section className="vc-preview-pane" aria-label="Prévia da tela de boas-vindas">
          <p className="vc-preview-label">Prévia · link privado</p>
          <div className="vc-welcome">
            <h2>Bem-vindo ao nosso casamento</h2>
            <p className="vc-names">{draft.nome || 'Nome do casamento'}</p>
            <p className="vc-date">{dataFmt}</p>
            <p className="vc-desc">
              {draft.descricaoRomantica || 'A descrição romântica aparece aqui.'}
            </p>
            <label className="vc-fake-field">
              Senha do casamento
              <input disabled placeholder="••••••••" />
            </label>
            <button type="button" disabled className="vc-fake-btn">
              Entrar no álbum
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
