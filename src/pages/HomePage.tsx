import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import '../App.css'

export function HomePage() {
  const { user, loading } = useAuth()

  return (
    <section className="classic-atmosphere home-classic">
      <div className="home-classic-glow" aria-hidden />
      <div className="home-classic-inner">
        <p className="home-brand classic-rise">Álbum coletivo</p>
        <div className="classic-ornament classic-rise" aria-hidden>
          <span>✦</span>
        </div>
        <h1 className="classic-rise-delay">O álbum do nosso casamento</h1>
        <p className="home-lead classic-rise-delay">
          Monte o álbum, compartilhe o link com os convidados e, quando quiser,
          publique a versão só de visualização.
        </p>

        {!loading && user ? (
          <p className="home-actions classic-rise-delay-2">
            <Link className="classic-cta" to="/painel">
              Ver nosso álbum
            </Link>
          </p>
        ) : (
          <p className="home-actions classic-rise-delay-2">
            <Link className="classic-cta" to="/entrar?proximo=criar">
              Começar o álbum
            </Link>
            <Link className="classic-link" to="/entrar">
              Já tenho conta — entrar
            </Link>
          </p>
        )}
      </div>
    </section>
  )
}
