import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import './auth-pages.css'

export function AuthPage() {
  const { user, loading, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const querCriar = searchParams.get('proximo') === 'criar'
  const [mode, setMode] = useState<'entrar' | 'criar'>(querCriar ? 'criar' : 'entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && user) {
    return <Navigate to="/painel" replace />
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'entrar') {
        await signIn(email.trim(), password)
        navigate('/painel')
      } else {
        await signUp(email.trim(), password)
        setInfo(
          'Conta criada. Se o e-mail precisar de confirmação, abra o link enviado; depois entre aqui.',
        )
        setMode('entrar')
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha na autenticação')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-brand">Álbum coletivo</p>
        <h1>{mode === 'entrar' ? 'Entrar' : 'Criar conta'}</h1>
        <p className="auth-lead">
          Uma conta para o álbum do casamento. Convidados usam só o link e a
          senha.
        </p>
        <form onSubmit={submit}>
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={
                mode === 'entrar' ? 'current-password' : 'new-password'
              }
            />
          </label>
          {erro && <p className="auth-erro">{erro}</p>}
          {info && <p className="auth-info">{info}</p>}
          <button type="submit" disabled={busy || loading}>
            {busy
              ? 'Aguarde…'
              : mode === 'entrar'
                ? 'Entrar'
                : 'Criar conta'}
          </button>
        </form>
        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setMode((m) => (m === 'entrar' ? 'criar' : 'entrar'))
            setErro('')
            setInfo('')
          }}
        >
          {mode === 'entrar'
            ? 'Ainda não tem conta? Criar conta'
            : 'Já tem conta? Entrar'}
        </button>
        <p className="auth-back">
          <Link to="/">Voltar ao início</Link>
        </p>
      </div>
    </div>
  )
}
