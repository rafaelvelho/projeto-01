import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  fetchMinePainel,
  formatBytes,
  formatDataCasamento,
  linkPrivado,
  linkPublico,
  type PainelResumo,
} from '../lib/album-api'
import { useAuth } from '../lib/auth'
import './auth-pages.css'

export function PainelPage() {
  const { user, session, loading, signOut } = useAuth()
  const [resumo, setResumo] = useState<PainelResumo | null>(null)
  const [erro, setErro] = useState('')
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    if (!session?.access_token) return
    let cancelled = false
    async function load() {
      setBusy(true)
      setErro('')
      try {
        const data = await fetchMinePainel(session!.access_token)
        if (!cancelled) setResumo(data)
      } catch (err) {
        if (!cancelled) {
          setErro(err instanceof Error ? err.message : 'Falha ao carregar o painel')
        }
      } finally {
        if (!cancelled) setBusy(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [session])

  if (!loading && !user) {
    return <Navigate to="/entrar" replace />
  }

  if (!busy && !erro && resumo && !resumo.casamento) {
    return <Navigate to="/criar" replace />
  }

  const c = resumo?.casamento

  return (
    <div className="auth-page painel-page classic-atmosphere">
      <div className="painel-wrap classic-panel classic-rise">
        <header className="painel-header">
          <div>
            <p className="auth-brand">Álbum coletivo</p>
            <div className="classic-ornament" aria-hidden style={{ marginLeft: 0, justifyContent: 'flex-start', width: 'min(12rem, 60%)' }}>
              <span>✦</span>
            </div>
            <h1>Nosso álbum</h1>
            <p className="auth-lead">{user?.email}</p>
          </div>
          <button type="button" className="painel-ghost" onClick={() => void signOut()}>
            Sair
          </button>
        </header>

        {erro && <p className="auth-erro">{erro}</p>}
        {busy && <p className="auth-lead">Carregando…</p>}

        {!busy && c && (
          <>
            <div className="painel-album-head">
              <h2>{c.nome}</h2>
              <p>
                {formatDataCasamento(c.data)}
                {c.publicado ? ' · público ativo' : ' · ainda não publicado'}
                {c.congelado ? ' · congelado' : ''}
              </p>
            </div>

            <div className="painel-metricas" aria-label="Resumo do álbum">
              <div className="painel-metrica">
                <p className="painel-metrica-valor">{resumo!.fotosCount}</p>
                <p className="painel-metrica-label">
                  {resumo!.fotosCount === 1 ? 'foto no álbum' : 'fotos no álbum'}
                </p>
              </div>
              <div className="painel-metrica">
                <p className="painel-metrica-valor">
                  {formatBytes(resumo!.bytesTotal)}
                </p>
                <p className="painel-metrica-label">espaço usado</p>
              </div>
            </div>

            <div className="painel-card-actions painel-acoes-principais">
              <a className="painel-cta" href={linkPrivado(c.slugPrivado)}>
                Abrir álbum privado
              </a>
              {c.publicado ? (
                <a
                  className="painel-cta"
                  href={linkPublico(c.slugPublico)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir álbum público
                </a>
              ) : (
                <span className="painel-muted">
                  Publique pelo menu Opções no álbum privado
                </span>
              )}
            </div>
          </>
        )}

        <p className="auth-back">
          <Link to="/">Voltar ao início</Link>
        </p>
      </div>
    </div>
  )
}
