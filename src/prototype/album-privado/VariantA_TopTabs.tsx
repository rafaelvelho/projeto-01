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

/** A — full welcome, then header + top tabs + modo noivos top-right */
export function VariantA_TopTabs({ state, setState }: Props) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [codigo, setCodigo] = useState('')
  const [showNoivos, setShowNoivos] = useState(false)
  const [erroNoivos, setErroNoivos] = useState('')

  function entrar(e: React.FormEvent) {
    e.preventDefault()
    if (senha === DEMO.senha) {
      setErro('')
      setState((s) => ({ ...s, unlocked: true, tab: 'enviar' }))
    } else {
      setErro('Senha incorreta. Tente de novo.')
    }
  }

  function unlockNoivos(e: React.FormEvent) {
    e.preventDefault()
    if (codigo === DEMO.codigoNoivos) {
      setErroNoivos('')
      setState((s) => ({ ...s, modoNoivos: true }))
      setShowNoivos(false)
    } else {
      setErroNoivos('Código incorreto.')
    }
  }

  function onFiles(files: FileList | null, by: 'convidado' | 'noivos') {
    if (!files?.length) return
    const next = Array.from(files)
      .filter((f) => f.type === 'image/jpeg' || f.type === 'image/png')
      .map((f) => fileToFakePhoto(f, by))
    setState((s) => ({ ...s, photos: [...next, ...s.photos], tab: 'album' }))
  }

  if (!state.unlocked) {
    return (
      <div className="aa-welcome">
        <h1>Bem-vindo ao nosso casamento</h1>
        <p className="aa-names">{state.nome}</p>
        <p className="aa-date">{state.dataLabel}</p>
        <p className="aa-desc">{state.descricao}</p>
        <form onSubmit={entrar}>
          <label>
            Senha do casamento
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="off"
            />
          </label>
          {erro && <p className="aa-erro">{erro}</p>}
          <button type="submit">Entrar no álbum</button>
        </form>
      </div>
    )
  }

  return (
    <div className="aa-app">
      <header className="aa-header">
        <div>
          <p className="aa-brand">Álbum coletivo</p>
          <h1>{state.nome}</h1>
        </div>
        <button
          type="button"
          className="aa-login-btn"
          onClick={() => setShowNoivos(true)}
        >
          {state.modoNoivos ? 'Noivos' : 'Área dos noivos'}
        </button>
      </header>

      <nav className="aa-tabs" aria-label="Seções">
        <button
          type="button"
          data-active={state.tab === 'enviar'}
          onClick={() => setState((s) => ({ ...s, tab: 'enviar' }))}
        >
          Enviar
        </button>
        <button
          type="button"
          data-active={state.tab === 'album'}
          onClick={() => setState((s) => ({ ...s, tab: 'album' }))}
        >
          Álbum ({state.photos.length})
        </button>
      </nav>

      {state.tab === 'enviar' && (
        <section className="aa-panel">
          {state.congelado && !state.modoNoivos ? (
            <p className="aa-frozen">
              O álbum está congelado. Só os noivos podem adicionar fotos agora.
            </p>
          ) : (
            <>
              <h2>Enviar fotos</h2>
              <p>JPG ou PNG do celular.</p>
              <label className="aa-drop">
                Escolher fotos
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={(e) =>
                    onFiles(
                      e.target.files,
                      state.modoNoivos ? 'noivos' : 'convidado',
                    )
                  }
                />
              </label>
            </>
          )}
        </section>
      )}

      {state.tab === 'album' && (
        <section className="aa-panel">
          <h2>Álbum</h2>
          {state.photos.length === 0 ? (
            <p>Ainda não há fotos. Envie a primeira!</p>
          ) : (
            <div className="aa-grid">
              {state.photos.map((p) => (
                <figure key={p.id}>
                  <img src={p.url} alt={p.name} />
                  {state.modoNoivos && (
                    <button
                      type="button"
                      className="aa-del"
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
        </section>
      )}

      {state.modoNoivos && (
        <section className="aa-admin">
          <h2>Modo noivos</h2>
          <div className="aa-admin-actions">
            <button
              type="button"
              onClick={() =>
                setState((s) => ({
                  ...s,
                  publicado: true,
                  congelado: true,
                }))
              }
            >
              Publicar álbum
            </button>
            <button
              type="button"
              onClick={() => setState((s) => ({ ...s, publicado: false }))}
            >
              Despublicar
            </button>
            <label className="aa-drop aa-drop-sm">
              Adicionar foto (noivos)
              <input
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={(e) => onFiles(e.target.files, 'noivos')}
              />
            </label>
          </div>
          <p className="aa-admin-status">
            Publicado: {state.publicado ? 'sim' : 'não'} · Congelado:{' '}
            {state.congelado ? 'sim' : 'não'}
          </p>
        </section>
      )}

      {showNoivos && !state.modoNoivos && (
        <div className="aa-modal" role="dialog">
          <form onSubmit={unlockNoivos}>
            <h2>Área dos noivos</h2>
            <label>
              Código dos noivos
              <input
                type="password"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </label>
            {erroNoivos && <p className="aa-erro">{erroNoivos}</p>}
            <div className="aa-modal-actions">
              <button type="button" onClick={() => setShowNoivos(false)}>
                Fechar
              </button>
              <button type="submit">Entrar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
