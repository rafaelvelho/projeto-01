import { useMemo, useState } from 'react'
import {
  SUGSTOES_DESCRICAO,
  type CriarCasamentoDraft,
  type CriarCasamentoResult,
} from './shared'

type Props = {
  onCreate: (draft: CriarCasamentoDraft) => void
  result: CriarCasamentoResult | null
}

const empty: CriarCasamentoDraft = {
  nome: '',
  data: '',
  descricaoRomantica: SUGSTOES_DESCRICAO[2],
  senhaCasamento: '',
  codigoNoivos: '',
}

/** C — split: form left, live guest welcome preview right */
export function VariantC_SplitPreview({ onCreate, result }: Props) {
  const [draft, setDraft] = useState(empty)
  const [copied, setCopied] = useState(false)
  const [sugIdx, setSugIdx] = useState(2)

  function update<K extends keyof CriarCasamentoDraft>(
    key: K,
    value: CriarCasamentoDraft[K],
  ) {
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

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onCreate(draft)
  }

  function cycleSuggestion() {
    const next = (sugIdx + 1) % SUGSTOES_DESCRICAO.length
    setSugIdx(next)
    update('descricaoRomantica', SUGSTOES_DESCRICAO[next])
  }

  async function copyLink() {
    if (!result) return
    await navigator.clipboard.writeText(result.linkPrivado)
    setCopied(true)
  }

  return (
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
          <button type="submit">Criar e copiar link</button>
        </form>

        {result && (
          <div className="vc-done">
            <code>{result.linkPrivado}</code>
            <button type="button" onClick={copyLink}>
              {copied ? 'Copiado' : 'Copiar link privado'}
            </button>
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
  )
}
