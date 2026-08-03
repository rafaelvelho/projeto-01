import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  albumAction,
  formatDataCasamento,
  type CasamentoPublico,
  type FotoItem,
} from '../lib/album-api'
import '../prototype/album-privado/album-privado.css'

export function AlbumPublicoPage() {
  const { slug = '' } = useParams()
  const [loading, setLoading] = useState(true)
  const [casamento, setCasamento] = useState<CasamentoPublico | null>(null)
  const [fotos, setFotos] = useState<FotoItem[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await albumAction<{
          casamento: CasamentoPublico
          fotos: FotoItem[]
        }>('public_album', { slugPublico: slug })
        if (cancelled) return
        setCasamento(res.casamento)
        setFotos(res.fotos)
      } catch {
        if (!cancelled) setCasamento(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <div className="proto-album-root">
        <p className="cc-empty">Carregando…</p>
      </div>
    )
  }

  if (!casamento) {
    return (
      <div className="proto-album-root">
        <div className="cc-welcome">
          <div className="cc-welcome-card">
            <h1 className="cc-names">Álbum público indisponível</h1>
            <p className="cc-desc">
              Este link ainda não foi publicado pelos noivos, ou o álbum foi
              despublicado.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="proto-album-root">
      <div className="cc-app">
        <header className="cc-bar">
          <div className="cc-bar-names">
            <strong>{casamento.nome}</strong>
            <span>{fotos.length} fotos</span>
          </div>
          <p className="cc-bar-phrase">{casamento.descricaoRomantica}</p>
          <p className="cc-bar-date">{formatDataCasamento(casamento.data)}</p>
        </header>

        {fotos.length === 0 ? (
          <div className="cc-empty-wrap">
            <p className="cc-empty">Nenhuma foto neste álbum ainda.</p>
          </div>
        ) : (
          <div className="cc-masonry">
            {fotos.map((p) => (
              <figure key={p.id}>
                <img src={p.url} alt="" />
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
