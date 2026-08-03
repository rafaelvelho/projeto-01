import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { CriarCasamentoPrototype } from './prototype/criar-casamento/CriarCasamentoPrototype'
import { readPrototypeSearch } from './prototype/criar-casamento/shared'
import { AlbumPrivadoPrototype } from './prototype/album-privado/AlbumPrivadoPrototype'
import { readAlbumPrototypeSearch } from './prototype/album-privado/shared'
import './App.css'

function ViteStarter() {
  const [count, setCount] = useState(0)
  const [supabaseStatus, setSupabaseStatus] = useState<
    'not-configured' | 'checking' | 'connected' | 'error'
  >(isSupabaseConfigured ? 'checking' : 'not-configured')

  useEffect(() => {
    if (!supabase) return

    supabase.auth
      .getSession()
      .then(() => setSupabaseStatus('connected'))
      .catch(() => setSupabaseStatus('error'))
  }, [])

  const statusLabel = {
    'not-configured': 'Supabase: configure o arquivo .env',
    checking: 'Supabase: conectando...',
    connected: 'Supabase: conectado',
    error: 'Supabase: erro na conexão',
  }[supabaseStatus]

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>legla</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
          <p className="supabase-status" data-status={supabaseStatus}>
            {statusLabel}
          </p>
          <p>
            <a href="/?prototype=criar-casamento&variant=C">
              Protótipo: criar casamento (C)
            </a>
          </p>
          <p>
            <a href="/?prototype=album-privado&variant=C">
              Protótipo: álbum privado (C)
            </a>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>
    </>
  )
}

function App() {
  if (readAlbumPrototypeSearch().isAlbumPrivado) {
    return <AlbumPrivadoPrototype />
  }
  if (readPrototypeSearch().isCriarCasamento) {
    return <CriarCasamentoPrototype />
  }
  return <ViteStarter />
}

export default App
