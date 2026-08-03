/**
 * PROTOTYPE — throwaway UI.
 * Question: how should "criar casamento" look/flow?
 * Three variants via ?prototype=criar-casamento&variant=A|B|C
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PrototypeSwitcher } from '../PrototypeSwitcher'
import { VariantA_CeremonyScroll } from './VariantA_CeremonyScroll'
import { VariantB_TwoSteps } from './VariantB_TwoSteps'
import { VariantC_SplitPreview } from './VariantC_SplitPreview'
import {
  buildResult,
  readPrototypeSearch,
  type CriarCasamentoDraft,
  type CriarCasamentoResult,
} from './shared'
import './criar-casamento.css'

export type { CriarCasamentoDraft, CriarCasamentoResult } from './shared'
export { SUGSTOES_DESCRICAO, buildResult } from './shared'

const VARIANTS = [
  { key: 'A', name: 'Ceremony scroll' },
  { key: 'B', name: 'Dois passos' },
  { key: 'C', name: 'Form + preview' },
] as const

export type VariantKey = (typeof VARIANTS)[number]['key']

function readVariant(): VariantKey {
  const v = readPrototypeSearch().variant
  if (v === 'B' || v === 'C' || v === 'A') return v
  // Winner of Wayfinder #7: Form + preview
  return 'C'
}

export function CriarCasamentoPrototype() {
  const [variant, setVariantState] = useState<VariantKey>(readVariant)
  const [result, setResult] = useState<CriarCasamentoResult | null>(null)

  const setVariant = useCallback((next: VariantKey) => {
    const params = new URLSearchParams()
    params.set('prototype', 'criar-casamento')
    params.set('variant', next)
    window.history.replaceState(null, '', `?${params.toString()}`)
    setVariantState(next)
    setResult(null)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.isContentEditable)
      ) {
        return
      }
      const idx = VARIANTS.findIndex((x) => x.key === variant)
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setVariant(VARIANTS[(idx - 1 + VARIANTS.length) % VARIANTS.length].key)
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setVariant(VARIANTS[(idx + 1) % VARIANTS.length].key)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [variant, setVariant])

  const onCreate = useCallback((draft: CriarCasamentoDraft) => {
    setResult(buildResult(draft))
  }, [])

  const label = useMemo(() => {
    const found = VARIANTS.find((x) => x.key === variant)
    return `${variant} — ${found?.name ?? ''}`
  }, [variant])

  return (
    <div className="proto-criar-root" data-variant={variant}>
      {import.meta.env.DEV && (
        <PrototypeSwitcher
          label={label}
          onPrev={() => {
            const idx = VARIANTS.findIndex((x) => x.key === variant)
            setVariant(
              VARIANTS[(idx - 1 + VARIANTS.length) % VARIANTS.length].key,
            )
          }}
          onNext={() => {
            const idx = VARIANTS.findIndex((x) => x.key === variant)
            setVariant(VARIANTS[(idx + 1) % VARIANTS.length].key)
          }}
        />
      )}

      {variant === 'A' && (
        <VariantA_CeremonyScroll onCreate={onCreate} result={result} />
      )}
      {variant === 'B' && (
        <VariantB_TwoSteps onCreate={onCreate} result={result} />
      )}
      {variant === 'C' && (
        <VariantC_SplitPreview onCreate={onCreate} result={result} />
      )}

      {result && (
        <aside className="proto-state-panel" aria-live="polite">
          <strong>Estado do protótipo (memória)</strong>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </aside>
      )}
    </div>
  )
}
