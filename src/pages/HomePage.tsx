import { Link } from 'react-router-dom'
import '../App.css'

export function HomePage() {
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
          Memórias do casamento
        </h1>
        <p style={{ margin: '0 0 1.75rem', color: 'var(--classic-muted)', lineHeight: 1.5 }}>
          Um álbum de fotos para o seu casamento — convidados enviam, todos veem.
        </p>
        <p>
          <Link
            to="/criar"
            style={{
              display: 'inline-block',
              background: 'var(--classic-champagne-deep)',
              color: 'var(--classic-white)',
              textDecoration: 'none',
              padding: '0.85rem 1.4rem',
              fontWeight: 700,
            }}
          >
            Criar casamento
          </Link>
        </p>
      </div>
    </section>
  )
}
