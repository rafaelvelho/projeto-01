/**
 * PROTOTYPE — throwaway UI.
 * Question: how should private link page look (welcome → Enviar | Álbum + Modo noivos)?
 * ?prototype=album-privado&variant=A|B|C
 *
 * Demo: senha = casamento · código noivos = noivos
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PrototypeSwitcher } from '../PrototypeSwitcher'
import { VariantA_TopTabs } from './VariantA_TopTabs'
import { VariantB_BottomNav } from './VariantB_BottomNav'
import { VariantC_AlbumFirst } from './VariantC_AlbumFirst'
import {
  initialAlbumState,
  readAlbumPrototypeSearch,
  type AlbumDemoState,
} from './shared'
import './album-privado.css'

const VARIANTS = [
  { key: 'A', name: 'Abas no topo' },
  { key: 'B', name: 'Navegação embaixo' },
  { key: 'C', name: 'Álbum primeiro' },
] as const

export type VariantKey = (typeof VARIANTS)[number]['key']

function readVariant(): VariantKey {
  const v = readAlbumPrototypeSearch().variant
  if (v === 'A' || v === 'B' || v === 'C') return v
  return 'C'
}

export function AlbumPrivadoPrototype() {
  const [variant, setVariantState] = useState<VariantKey>(readVariant)
  const [state, setState] = useState<AlbumDemoState>(initialAlbumState)

  useEffect(() => {
    const root = document.getElementById('root')
    root?.classList.add('prototype-shell')
    return () => root?.classList.remove('prototype-shell')
  }, [])

  const setVariant = useCallback((next: VariantKey) => {
    const params = new URLSearchParams()
    params.set('prototype', 'album-privado')
    params.set('variant', next)
    window.history.replaceState(null, '', `?${params.toString()}`)
    setVariantState(next)
    setState(initialAlbumState())
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

  const label = useMemo(() => {
    const found = VARIANTS.find((x) => x.key === variant)
    return `${variant} — ${found?.name ?? ''}`
  }, [variant])

  const props = { state, setState }

  return (
    <div className="proto-album-root" data-variant={variant}>
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

      <p className="proto-album-hint">
        Protótipo · senha <code>casamento</code> · código noivos{' '}
        <code>noivos</code>
      </p>

      {variant === 'A' && <VariantA_TopTabs {...props} />}
      {variant === 'B' && <VariantB_BottomNav {...props} />}
      {variant === 'C' && <VariantC_AlbumFirst {...props} />}

      <aside className="proto-state-panel" aria-live="polite">
        <strong>Estado (memória)</strong>
        <pre>
          {JSON.stringify(
            {
              unlocked: state.unlocked,
              tab: state.tab,
              modoNoivos: state.modoNoivos,
              fotos: state.photos.length,
              congelado: state.congelado,
              publicado: state.publicado,
            },
            null,
            2,
          )}
        </pre>
      </aside>
    </div>
  )
}
