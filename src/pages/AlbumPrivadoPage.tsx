import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  albumAction,
  albumUpload,
  clearSession,
  formatDataCasamento,
  linkPublico,
  readSession,
  writeSession,
  type CasamentoPublico,
  type FotoItem,
  type Papel,
} from '../lib/album-api'
import { downloadAlbumZip } from '../lib/download-album'
import '../prototype/album-privado/album-privado.css'

export function AlbumPrivadoPage() {
  const { slug = '' } = useParams()
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [casamento, setCasamento] = useState<CasamentoPublico | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [papel, setPapel] = useState<Papel>('convidado')
  const [fotos, setFotos] = useState<FotoItem[]>([])
  const [senha, setSenha] = useState('')
  const [codigo, setCodigo] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [showSend, setShowSend] = useState(false)
  const [showNoivos, setShowNoivos] = useState(false)
  const [painelNoivosAberto, setPainelNoivosAberto] = useState(false)
  const [linkPublicoCopiado, setLinkPublicoCopiado] = useState(false)
  const [busy, setBusy] = useState(false)
  const [baixando, setBaixando] = useState(false)

  const unlocked = Boolean(token && casamento)
  const modoNoivos = papel === 'noivos'
  const envioConvidadoBloqueado = Boolean(casamento?.congelado && !modoNoivos)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      setLoading(true)
      setErro('')
      try {
        const welcome = await albumAction<{ casamento: CasamentoPublico }>(
          'welcome',
          { slugPrivado: slug },
        )
        if (cancelled) return
        setCasamento(welcome.casamento)

        const saved = readSession(slug)
        if (!saved) return
        try {
          const album = await albumAction<{
            papel: Papel
            casamento: CasamentoPublico
            fotos: FotoItem[]
          }>('album', {}, saved.token)
          if (cancelled) return
          setToken(saved.token)
          setPapel(album.papel)
          setCasamento(album.casamento)
          setFotos(album.fotos)
          writeSession(slug, saved.token, album.papel)
        } catch {
          clearSession(slug)
          setToken(null)
        }
      } catch (err) {
        if (!cancelled) {
          setCasamento(null)
          setErro(err instanceof Error ? err.message : 'Erro')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [slug])

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErro('')
    try {
      const res = await albumAction<{
        token: string
        papel: Papel
        casamento: CasamentoPublico
        fotos: FotoItem[]
      }>('unlock', { slugPrivado: slug, senhaCasamento: senha })
      setToken(res.token)
      setPapel(res.papel)
      setCasamento(res.casamento)
      setFotos(res.fotos)
      writeSession(slug, res.token, res.papel)
      setSenha('')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao entrar')
    } finally {
      setBusy(false)
    }
  }

  async function unlockNoivos(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setBusy(true)
    setErro('')
    try {
      const res = await albumAction<{ token: string; papel: Papel }>(
        'unlock_noivos',
        { codigoNoivos: codigo },
        token,
      )
      setToken(res.token)
      setPapel(res.papel)
      writeSession(slug, res.token, res.papel)
      setPainelNoivosAberto(true)
      setShowNoivos(false)
      setCodigo('')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Código inválido')
    } finally {
      setBusy(false)
    }
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length || !token) return
    if (casamento?.congelado && !modoNoivos) return
    setBusy(true)
    setErro('')
    try {
      const uploaded: FotoItem[] = []
      for (const file of Array.from(files)) {
        if (file.type !== 'image/jpeg' && file.type !== 'image/png') continue
        const res = await albumUpload(file, token)
        uploaded.push(res.foto)
      }
      setFotos((prev) => [...uploaded, ...prev])
      setShowSend(false)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha no envio')
    } finally {
      setBusy(false)
    }
  }

  async function apagar(fotoId: string) {
    if (!token || !modoNoivos) return
    if (!window.confirm('Apagar esta foto? Esta ação não pode ser desfeita.')) {
      return
    }
    setBusy(true)
    try {
      await albumAction('delete_foto', { fotoId }, token)
      setFotos((prev) => prev.filter((f) => f.id !== fotoId))
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao apagar')
    } finally {
      setBusy(false)
    }
  }

  async function publicar() {
    if (!token) return
    setBusy(true)
    try {
      const res = await albumAction<{ casamento: CasamentoPublico }>(
        'publish',
        {},
        token,
      )
      setCasamento(res.casamento)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao publicar')
    } finally {
      setBusy(false)
    }
  }

  async function despublicar() {
    if (!token) return
    if (
      !window.confirm(
        'Despublicar o álbum? O link público deixa de funcionar até publicar de novo.',
      )
    ) {
      return
    }
    setBusy(true)
    try {
      const res = await albumAction<{ casamento: CasamentoPublico }>(
        'unpublish',
        {},
        token,
      )
      setCasamento(res.casamento)
      setLinkPublicoCopiado(false)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao despublicar')
    } finally {
      setBusy(false)
    }
  }

  async function trocarSenha(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !novaSenha) return
    setBusy(true)
    try {
      await albumAction('change_senha', { novaSenha }, token)
      setNovaSenha('')
      setErro('')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao trocar senha')
    } finally {
      setBusy(false)
    }
  }

  function voltarConvidado() {
    if (!token) return
    setPapel('convidado')
    writeSession(slug, token, 'convidado')
    setPainelNoivosAberto(false)
    setLinkPublicoCopiado(false)
  }

  async function gerarLinkPublico() {
    const url = linkPublico(casamento!.slugPublico)
    try {
      await navigator.clipboard.writeText(url)
      setLinkPublicoCopiado(true)
      setErro('')
    } catch {
      setErro('Não foi possível copiar o link. Copie manualmente abaixo.')
      setLinkPublicoCopiado(true)
    }
  }

  async function baixarAlbum() {
    if (!casamento || fotos.length === 0) return
    setBaixando(true)
    setErro('')
    try {
      await downloadAlbumZip(casamento.nome, fotos)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao baixar o álbum')
    } finally {
      setBaixando(false)
    }
  }

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
            <h1 className="cc-names">Link não encontrado</h1>
            <p className="cc-desc">{erro || 'Este link privado não existe.'}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!unlocked) {
    return (
      <div className="proto-album-root">
        <div className="cc-welcome">
          <div className="cc-welcome-card">
            <p className="cc-eyebrow">Bem-vindo ao nosso casamento</p>
            <div className="classic-ornament" aria-hidden>
              <span>✦</span>
            </div>
            <h1 className="cc-names">{casamento.nome}</h1>
            <p className="cc-meta">{formatDataCasamento(casamento.data)}</p>
            <p className="cc-desc">{casamento.descricaoRomantica}</p>
            <form onSubmit={entrar}>
              <label className="cc-field">
                Senha
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="off"
                  required
                />
              </label>
              {erro && <p className="aa-erro">{erro}</p>}
              <button type="submit" disabled={busy}>
                {busy ? 'Entrando…' : 'Ver o álbum'}
              </button>
            </form>
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
          <button
            type="button"
            className="cc-noivos-btn"
            aria-expanded={modoNoivos ? painelNoivosAberto : undefined}
            aria-controls={modoNoivos ? 'painel-noivos' : undefined}
            onClick={() => {
              if (modoNoivos) {
                setPainelNoivosAberto((aberto) => !aberto)
              } else {
                setShowNoivos(true)
              }
            }}
          >
            {modoNoivos ? 'Opções' : 'Noivos'}
          </button>
          {modoNoivos && painelNoivosAberto && (
            <div className="cc-admin-dock" id="painel-noivos">
              <button type="button" onClick={() => void publicar()} disabled={busy}>
                {casamento.publicado ? 'Republicar' : 'Publicar'}
              </button>
              <button
                type="button"
                onClick={() => void despublicar()}
                disabled={busy || !casamento.publicado}
              >
                Despublicar
              </button>
              <button type="button" onClick={voltarConvidado}>
                Voltar ao modo convidado
              </button>
              <button
                type="button"
                onClick={() => void baixarAlbum()}
                disabled={fotos.length === 0 || baixando || busy}
              >
                {baixando ? 'Preparando ZIP…' : 'Baixar álbum'}
              </button>
              <button
                type="button"
                onClick={() => void gerarLinkPublico()}
                disabled={!casamento.publicado}
                title={
                  casamento.publicado
                    ? 'Copia o link público'
                    : 'Publique o álbum antes de gerar o link'
                }
              >
                {linkPublicoCopiado ? 'Link copiado' : 'Gerar link'}
              </button>
              {linkPublicoCopiado && (
                <code className="cc-admin-link">
                  {linkPublico(casamento.slugPublico)}
                </code>
              )}
              <form onSubmit={trocarSenha} className="cc-admin-senha">
                <input
                  type="password"
                  placeholder="Nova senha"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                />
                <button type="submit" disabled={busy || !novaSenha}>
                  Trocar senha
                </button>
              </form>
            </div>
          )}
        </header>

        {(casamento.congelado || casamento.publicado) && (
          <div className="cc-status-banner" role="status">
            {casamento.congelado && (
              <p>
                {modoNoivos
                  ? 'Álbum congelado: convidados não enviam mais. Noivos ainda podem enviar e apagar.'
                  : 'Álbum congelado: o envio pelos convidados foi encerrado após a publicação.'}
              </p>
            )}
            {casamento.publicado ? (
              <div className="cc-status-public">
                <p>Link público ativo — quem tiver o link pode só ver as fotos.</p>
                <Link
                  className="cc-status-public-btn"
                  to={`/a/${casamento.slugPublico}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir álbum público
                </Link>
              </div>
            ) : casamento.congelado ? (
              <p>Link público desligado no momento.</p>
            ) : null}
          </div>
        )}

        {erro && <p className="aa-erro" style={{ padding: '0 1rem' }}>{erro}</p>}

        {fotos.length === 0 ? (
          <div className="cc-empty-wrap">
            <p className="cc-empty">Nenhuma foto ainda — envie a primeira.</p>
          </div>
        ) : (
          <div className="cc-masonry">
            {fotos.map((p) => (
              <figure key={p.id}>
                <img src={p.url} alt="" />
                {modoNoivos && (
                  <button type="button" onClick={() => void apagar(p.id)}>
                    Apagar
                  </button>
                )}
              </figure>
            ))}
          </div>
        )}

        <div className="cc-actions-bar">
          <button
            type="button"
            className="cc-download-btn"
            onClick={() => void baixarAlbum()}
            disabled={fotos.length === 0 || baixando || busy}
          >
            {baixando ? 'Preparando ZIP…' : 'Baixar álbum'}
          </button>
          <button
            type="button"
            className="cc-fab"
            onClick={() => setShowSend(true)}
            disabled={envioConvidadoBloqueado || busy}
            title={
              envioConvidadoBloqueado
                ? 'Envio de convidados congelado'
                : 'Enviar ou tirar foto'
            }
          >
            Enviar fotos
          </button>
        </div>
        {envioConvidadoBloqueado && (
          <p className="cc-fab-hint">Envio de convidados congelado.</p>
        )}

        {showSend && !envioConvidadoBloqueado && (
          <div className="aa-modal">
            <div className="cc-sheet">
              <h2>Enviar</h2>
              <p>JPG ou PNG</p>
              <label className="aa-drop">
                Escolher da galeria
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={(e) => void onFiles(e.target.files)}
                />
              </label>
              <button type="button" onClick={() => setShowSend(false)}>
                Fechar
              </button>
            </div>
          </div>
        )}

        {showNoivos && !modoNoivos && (
          <div className="aa-modal">
            <form className="cc-noivos-modal" onSubmit={unlockNoivos}>
              <h2>Código dos noivos</h2>
              <label className="cc-field">
                Código
                <input
                  type="password"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  autoComplete="off"
                />
              </label>
              {erro && <p className="aa-erro">{erro}</p>}
              <div className="aa-modal-actions">
                <button type="button" onClick={() => setShowNoivos(false)}>
                  Fechar
                </button>
                <button type="submit" disabled={busy}>
                  Entrar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
