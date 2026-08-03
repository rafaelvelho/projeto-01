import { useState, type Dispatch, type SetStateAction } from 'react'
import {
  DEMO,
  fileToFakePhoto,
  type AlbumDemoState,
} from './shared'

type Props = {
  state: AlbumDemoState
  setState: Dispatch<SetStateAction<AlbumDemoState>>
}

/** C — album-first masonry; Enviar opens as overlay; noivos top-right */
export function VariantC_AlbumFirst({ state, setState }: Props) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [codigo, setCodigo] = useState('')
  const [showSend, setShowSend] = useState(false)
  const [showNoivos, setShowNoivos] = useState(false)

  function entrar(e: React.FormEvent) {
    e.preventDefault()
    if (senha === DEMO.senha) {
      setErro('')
      setState((s) => ({ ...s, unlocked: true, tab: 'album' }))
    } else setErro('Senha incorreta. Tente de novo.')
  }

  function unlockNoivos(e: React.FormEvent) {
    e.preventDefault()
    if (codigo === DEMO.codigoNoivos) {
      setState((s) => ({ ...s, modoNoivos: true }))
      setShowNoivos(false)
    }
  }

  function onFiles(files: FileList | null) {
    if (!files?.length) return
    if (state.congelado && !state.modoNoivos) return
    const next = Array.from(files)
      .filter((f) => f.type === 'image/jpeg' || f.type === 'image/png')
      .map((f) =>
        fileToFakePhoto(f, state.modoNoivos ? 'noivos' : 'convidado'),
      )
    setState((s) => ({ ...s, photos: [...next, ...s.photos] }))
    setShowSend(false)
  }

  if (!state.unlocked) {
    return (
      <div className="cc-welcome">
        <div className="cc-welcome-card">
          <p className="cc-eyebrow">Bem-vindo ao nosso casamento</p>
          <h1 className="cc-names">{state.nome}</h1>
          <p className="cc-meta">{state.dataLabel}</p>
          <p className="cc-desc">{state.descricao}</p>
          <form onSubmit={entrar}>
            <label className="cc-field">
              Senha
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="off"
              />
            </label>
            {erro && <p className="aa-erro">{erro}</p>}
            <button type="submit">Ver o álbum</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="cc-app">
      <header className="cc-bar">
        <div className="cc-bar-names">
          <strong>{state.nome}</strong>
          <span>{state.photos.length} fotos</span>
        </div>
        <p className="cc-bar-phrase">{state.descricao}</p>
        <button type="button" className="cc-noivos-btn" onClick={() => setShowNoivos(true)}>
          {state.modoNoivos ? 'Noivos ativos' : 'Noivos'}
        </button>
      </header>

      {state.photos.length === 0 ? (
        <div className="cc-empty-wrap">
          <p className="cc-empty">Nenhuma foto ainda — envie a primeira.</p>
        </div>
      ) : (
        <div className="cc-masonry">
          {state.photos.map((p) => (
            <figure key={p.id}>
              <img src={p.url} alt={p.name} />
              {state.modoNoivos && (
                <button
                  type="button"
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      photos: s.photos.filter((x) => x.id !== p.id),
                    }))
                  }
                >
                  Apagar
                </button>
              )}
            </figure>
          ))}
        </div>
      )}

      <button
        type="button"
        className="cc-fab"
        onClick={() => setShowSend(true)}
        disabled={state.congelado && !state.modoNoivos}
      >
        Enviar fotos
      </button>

      {showSend && (
        <div className="aa-modal">
          <div className="cc-sheet">
            <h2>Enviar</h2>
            <p>JPG ou PNG</p>
            <label className="aa-drop">
              Escolher do celular
              <input
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={(e) => onFiles(e.target.files)}
              />
            </label>
            <button type="button" onClick={() => setShowSend(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {showNoivos && !state.modoNoivos && (
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
            <div className="aa-modal-actions">
              <button type="button" onClick={() => setShowNoivos(false)}>
                Fechar
              </button>
              <button type="submit">Entrar</button>
            </div>
          </form>
        </div>
      )}

      {state.modoNoivos && (
        <div className="cc-admin-dock">
          <button
            type="button"
            onClick={() =>
              setState((s) => ({ ...s, publicado: true, congelado: true }))
            }
          >
            Publicar
          </button>
          <button
            type="button"
            onClick={() => setState((s) => ({ ...s, publicado: false }))}
          >
            Despublicar
          </button>
          <button
            type="button"
            className="cc-admin-guest"
            onClick={() => setState((s) => ({ ...s, modoNoivos: false }))}
          >
            Voltar ao modo convidado
          </button>
        </div>
      )}
    </div>
  )
}
