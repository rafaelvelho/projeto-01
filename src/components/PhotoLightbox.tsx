import { useEffect, useRef, useState } from 'react'
import {
  albumShareFile,
  podeCompartilharNativo,
  type FotoItem,
} from '../lib/album-api'

type Props = {
  fotos: FotoItem[]
  index: number
  titulo: string
  /** Sessão do álbum privado; omitir no público. */
  albumToken?: string | null
  onClose: () => void
  onIndexChange: (index: number) => void
}

const SWIPE_MIN = 48

export function PhotoLightbox({
  fotos,
  index,
  titulo,
  albumToken = null,
  onClose,
  onIndexChange,
}: Props) {
  const [compartilhando, setCompartilhando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [menuAberto, setMenuAberto] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const foto = fotos[index] ?? null
  const temAnterior = index > 0
  const temProxima = index < fotos.length - 1
  const nativo = podeCompartilharNativo()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1)
      if (e.key === 'ArrowRight' && index < fotos.length - 1) {
        onIndexChange(index + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [fotos.length, index, onClose, onIndexChange])

  useEffect(() => {
    setAviso('')
    setMenuAberto(false)
  }, [index])

  function onTouchStart(e: React.TouchEvent) {
    const t = e.changedTouches[0]
    if (!t) return
    touchStart.current = { x: t.clientX, y: t.clientY }
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current
    const t = e.changedTouches[0]
    touchStart.current = null
    if (!start || !t) return

    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Math.abs(dx) < SWIPE_MIN) return
    if (Math.abs(dx) < Math.abs(dy)) return

    if (dx < 0 && index < fotos.length - 1) onIndexChange(index + 1)
    if (dx > 0 && index > 0) onIndexChange(index - 1)
  }

  if (!foto) return null

  const textoShare = titulo
    ? `Olha esta foto de ${titulo}`
    : 'Olha esta foto do álbum'
  const paginaUrl = window.location.href

  async function compartilharNativo() {
    if (!foto) return
    setCompartilhando(true)
    setAviso('')
    setMenuAberto(false)
    try {
      const file = await albumShareFile(foto.id, albumToken)
      const payloadFiles = { files: [file], title: titulo || 'Álbum', text: textoShare }
      if (navigator.canShare?.(payloadFiles)) {
        await navigator.share(payloadFiles)
        return
      }
      await navigator.share({
        title: titulo || 'Álbum',
        text: textoShare,
        url: paginaUrl,
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setAviso(
        err instanceof Error ? err.message : 'Não foi possível abrir o compartilhar',
      )
    } finally {
      setCompartilhando(false)
    }
  }

  function abrirWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(`${textoShare}\n${paginaUrl}`)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setMenuAberto(false)
  }

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(paginaUrl)
      setAviso('Link do álbum copiado.')
    } catch {
      setAviso('Não foi possível copiar o link.')
    }
    setMenuAberto(false)
  }

  function onShareClick() {
    setAviso('')
    if (nativo) {
      void compartilharNativo()
      return
    }
    setMenuAberto((v) => !v)
  }

  return (
    <div
      className="cc-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Foto ampliada"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="cc-lightbox-stage" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="cc-lightbox-close"
          onClick={onClose}
          aria-label="Fechar"
        >
          Fechar
        </button>

        <button
          type="button"
          className="cc-lightbox-nav cc-lightbox-prev"
          onClick={() => temAnterior && onIndexChange(index - 1)}
          disabled={!temAnterior}
          aria-label="Foto anterior"
        >
          ‹
        </button>

        <img
          src={foto.url}
          alt=""
          className="cc-lightbox-img"
          draggable={false}
        />

        <button
          type="button"
          className="cc-lightbox-nav cc-lightbox-next"
          onClick={() => temProxima && onIndexChange(index + 1)}
          disabled={!temProxima}
          aria-label="Próxima foto"
        >
          ›
        </button>

        <div className="cc-lightbox-bar">
          <p className="cc-lightbox-count">
            {index + 1} / {fotos.length}
          </p>
          <button
            type="button"
            className="cc-lightbox-share"
            onClick={onShareClick}
            disabled={compartilhando}
          >
            {compartilhando ? 'Preparando…' : 'Compartilhar'}
          </button>
        </div>

        {menuAberto && (
          <div className="cc-lightbox-share-menu" role="menu">
            <p>
              Neste navegador o menu nativo não está disponível. Escolha:
            </p>
            <button type="button" onClick={abrirWhatsApp}>
              WhatsApp
            </button>
            <button type="button" onClick={() => void copiarLink()}>
              Copiar link do álbum
            </button>
            <p className="cc-lightbox-share-hint">
              No celular, pelo site em HTTPS, o botão abre WhatsApp, Instagram e
              outros apps com a foto.
            </p>
          </div>
        )}

        {aviso && <p className="cc-lightbox-aviso">{aviso}</p>}
      </div>
    </div>
  )
}
