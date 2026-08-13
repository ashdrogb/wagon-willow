import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      const redirectTo = location.state?.from?.pathname || '/simulator'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <p className="eyebrow">Account</p>
          <h1 className="page-title">Log in</h1>
          <p className="page-sub">Log in to run the match simulator and save your results.</p>
        </div>

        <div className="card auth-form">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="validation" style={{ marginBottom: 12 }}>{error}</p>}
            <button className="btn primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>
          <p className="mono" style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 16, textAlign: 'center' }}>
            No account? <Link to="/register" style={{ color: 'var(--amber)' }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
