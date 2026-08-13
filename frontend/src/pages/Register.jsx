import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setSubmitting(true)
    try {
      await register(email, name, password)
      navigate('/simulator', { replace: true })
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
          <h1 className="page-title">Create an account</h1>
          <p className="page-sub">Needed to run the match simulator and keep a history of your results.</p>
        </div>

        <div className="card auth-form">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="password">Password (min 8 characters)</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            {error && <p className="validation" style={{ marginBottom: 12 }}>{error}</p>}
            <button className="btn primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="mono" style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 16, textAlign: 'center' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--amber)' }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
