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
  descricaoRomantica: SUGSTOES_DESCRICAO[1],
  senhaCasamento: '',
  codigoNoivos: '',
}

/** B — two steps: celebration details, then secrets + copy link */
export function VariantB_TwoSteps({ onCreate, result }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [draft, setDraft] = useState(empty)
  const [copied, setCopied] = useState(false)

  function update<K extends keyof CriarCasamentoDraft>(
    key: K,
    value: CriarCasamentoDraft[K],
  ) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function next(e: React.FormEvent) {
    e.preventDefault()
    setStep(2)
  }

  function finish(e: React.FormEvent) {
    e.preventDefault()
    onCreate(draft)
  }

  async function copyLink() {
    if (!result) return
    await navigator.clipboard.writeText(result.linkPrivado)
    setCopied(true)
  }

  return (
    <div className="vb-page">
      <aside className="vb-rail">
        <p className="vb-brand">Álbum coletivo</p>
        <ol>
          <li data-active={step === 1}>Sobre o dia</li>
          <li data-active={step === 2}>Senhas e link</li>
        </ol>
      </aside>

      <main className="vb-main">
        {step === 1 && (
          <form onSubmit={next}>
            <h1>Sobre o dia</h1>
            <p className="vb-lead">Só o essencial para a página dos convidados.</p>
            <label>
              Nome do casamento
              <input
                value={draft.nome}
                onChange={(e) => update('nome', e.target.value)}
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
              <select
                value={draft.descricaoRomantica}
                onChange={(e) => update('descricaoRomantica', e.target.value)}
              >
                {SUGSTOES_DESCRICAO.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ou edite o texto
              <textarea
                rows={3}
                value={draft.descricaoRomantica}
                onChange={(e) => update('descricaoRomantica', e.target.value)}
              />
            </label>
            <button type="submit">Continuar</button>
          </form>
        )}

        {step === 2 && !result && (
          <form onSubmit={finish}>
            <h1>Senhas e link</h1>
            <p className="vb-lead">
              Senha do casamento para convidados. Código dos noivos para o Modo
              noivos.
            </p>
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
            <div className="vb-actions">
              <button type="button" className="vb-ghost" onClick={() => setStep(1)}>
                Voltar
              </button>
              <button type="submit">Criar casamento</button>
            </div>
          </form>
        )}

        {result && (
          <section className="vb-done">
            <h1>Link privado</h1>
            <p>Envie no grupo do casamento. O link público só nasce ao publicar.</p>
            <div className="vb-link-row">
              <code>{result.linkPrivado}</code>
              <button type="button" onClick={copyLink}>
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
