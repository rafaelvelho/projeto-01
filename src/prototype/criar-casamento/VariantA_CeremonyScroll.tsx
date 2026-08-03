import { useState } from 'react'
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
  descricaoRomantica: SUGSTOES_DESCRICAO[0],
  senhaCasamento: '',
  codigoNoivos: '',
}

/** A — one long ceremony scroll: brand first, single column, no card grid */
export function VariantA_CeremonyScroll({ onCreate, result }: Props) {
  const [draft, setDraft] = useState(empty)
  const [copied, setCopied] = useState(false)

  function update<K extends keyof CriarCasamentoDraft>(
    key: K,
    value: CriarCasamentoDraft[K],
  ) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onCreate(draft)
  }

  async function copyLink() {
    if (!result) return
    await navigator.clipboard.writeText(result.linkPrivado)
    setCopied(true)
  }

  return (
    <div className="va-page">
      <header className="va-hero">
        <p className="va-brand">Álbum coletivo</p>
        <h1>Criar o casamento</h1>
        <p className="va-lead">
          Defina o álbum dos convidados. Depois você copia o link privado.
        </p>
      </header>

      <form className="va-form" onSubmit={submit}>
        <label>
          Nome do casamento
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
          Descrição romântica
          <textarea
            rows={3}
            value={draft.descricaoRomantica}
            onChange={(e) => update('descricaoRomantica', e.target.value)}
          />
        </label>
        <div className="va-suggestions">
          {SUGSTOES_DESCRICAO.map((s) => (
            <button
              key={s}
              type="button"
              className="va-chip"
              onClick={() => update('descricaoRomantica', s)}
            >
              {s}
            </button>
          ))}
        </div>
        <label>
          Senha do casamento
          <input
            type="password"
            value={draft.senhaCasamento}
            onChange={(e) => update('senhaCasamento', e.target.value)}
            required
            autoComplete="new-password"
          />
        </label>
        <label>
          Código dos noivos
          <input
            type="password"
            value={draft.codigoNoivos}
            onChange={(e) => update('codigoNoivos', e.target.value)}
            required
            autoComplete="new-password"
          />
        </label>
        <button type="submit" className="va-submit">
          Criar e gerar link privado
        </button>
      </form>

      {result && (
        <section className="va-done">
          <h2>Pronto</h2>
          <p>Compartilhe só com quem deve enviar fotos:</p>
          <code>{result.linkPrivado}</code>
          <button type="button" onClick={copyLink}>
            {copied ? 'Copiado' : 'Copiar link privado'}
          </button>
        </section>
      )}
    </div>
  )
}
