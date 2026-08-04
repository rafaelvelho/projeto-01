import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import '../App.css'

export function HomePage() {
  const { user, loading } = useAuth()

  return (
    <section
      className="home-classic"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.25rem',
        background:
          'linear-gradient(165deg, var(--classic-cream) 0%, var(--classic-beige) 60%, var(--classic-nude) 100%)',
        fontFamily: 'var(--classic-sans)',
        color: 'var(--classic-ink)',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 520 }}>
        <p
          style={{
            margin: '0 0 0.75rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            color: 'var(--classic-champagne-deep)',
          }}
        >
          Álbum coletivo
        </p>
        <h1
          style={{
            margin: '0 0 1rem',
            fontFamily: 'var(--classic-serif)',
            fontWeight: 600,
            fontSize: 'clamp(2.4rem, 6vw, 3.4rem)',
            lineHeight: 1.15,
            color: 'var(--classic-ink)',
          }}
        >
          O álbum do nosso casamento
        </h1>
        <p
          style={{
            margin: '0 0 1.75rem',
            color: 'var(--classic-muted)',
            lineHeight: 1.5,
          }}
        >
          Monte o álbum, compartilhe o link com os convidados e, quando quiser,
          publique a versão só de visualização.
        </p>

        {!loading && user ? (
          <p>
            <Link
              to="/painel"
              style={{
                display: 'inline-block',
                background: 'var(--classic-champagne-deep)',
                color: 'var(--classic-white)',
                textDecoration: 'none',
                padding: '0.85rem 1.4rem',
                fontWeight: 700,
              }}
            >
              Ver nosso álbum
            </Link>
          </p>
        ) : (
          <p
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              alignItems: 'center',
            }}
          >
            <Link
              to="/entrar?proximo=criar"
              style={{
                display: 'inline-block',
                background: 'var(--classic-champagne-deep)',
                color: 'var(--classic-white)',
                textDecoration: 'none',
                padding: '0.85rem 1.4rem',
                fontWeight: 700,
              }}
            >
              Começar o álbum
            </Link>
            <Link
              to="/entrar"
              style={{
                color: 'var(--classic-champagne-deep)',
                fontSize: '0.95rem',
              }}
            >
              Já tenho conta — entrar
            </Link>
          </p>
        )}
      </div>
    </section>
  )
}
