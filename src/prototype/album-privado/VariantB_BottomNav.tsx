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

/** B — mobile-first: bottom nav, compact welcome, sticky noivos chip */
export function VariantB_BottomNav({ state, setState }: Props) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [codigo, setCodigo] = useState('')
  const [askNoivos, setAskNoivos] = useState(false)

  function entrar(e: React.FormEvent) {
    e.preventDefault()
    if (senha === DEMO.senha) {
      setErro('')
      setState((s) => ({ ...s, unlocked: true, tab: 'enviar' }))
    } else setErro('Senha incorreta. Tente de novo.')
  }

  function unlockNoivos(e: React.FormEvent) {
    e.preventDefault()
    if (codigo === DEMO.codigoNoivos) {
      setState((s) => ({ ...s, modoNoivos: true }))
      setAskNoivos(false)
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
    setState((s) => ({ ...s, photos: [...next, ...s.photos], tab: 'album' }))
  }

  if (!state.unlocked) {
    return (
      <div className="bb-welcome">
        <p className="bb-kicker">{state.dataLabel}</p>
        <h1>{state.nome}</h1>
        <p>{state.descricao}</p>
        <form onSubmit={entrar}>
          <input
            type="password"
            placeholder="Senha do casamento"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          {erro && <p className="aa-erro">{erro}</p>}
          <button type="submit">Continuar</button>
        </form>
      </div>
    )
  }

  return (
    <div className="bb-app">
      <header className="bb-top">
        <span>{state.nome}</span>
        <button type="button" onClick={() => setAskNoivos(true)}>
          {state.modoNoivos ? '● Noivos' : 'Entrar'}
        </button>
      </header>

      <main className="bb-main">
        {state.tab === 'enviar' && (
          <div className="bb-send">
            <h2>Mande suas fotos</h2>
            {state.congelado && !state.modoNoivos ? (
              <p>Envios de convidados encerrados.</p>
            ) : (
              <label className="bb-big-upload">
                <span>Toque para escolher JPG/PNG</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={(e) => onFiles(e.target.files)}
                />
              </label>
            )}
          </div>
        )}
        {state.tab === 'album' && (
          <div className="bb-strip">
            {state.photos.length === 0 && <p>O álbum ainda está vazio.</p>}
            {state.photos.map((p) => (
              <div key={p.id} className="bb-shot">
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
              </div>
            ))}
          </div>
        )}

        {state.modoNoivos && (
          <div className="bb-admin">
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
          </div>
        )}
      </main>

      <nav className="bb-bottom">
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
          Álbum
        </button>
      </nav>

      {askNoivos && !state.modoNoivos && (
        <div className="aa-modal">
          <form onSubmit={unlockNoivos}>
            <h2>Código dos noivos</h2>
            <input
              type="password"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
            <div className="aa-modal-actions">
              <button type="button" onClick={() => setAskNoivos(false)}>
                Fechar
              </button>
              <button type="submit">OK</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
