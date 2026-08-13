import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'

export default function Home() {
  const [matches, setMatches] = useState([])
  const [status, setStatus] = useState('idle')
  const navigate = useNavigate()

  useEffect(() => {
    setStatus('loading')
    api.getMatches()
      .then((data) => { setMatches(data); setStatus('ready') })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <p className="eyebrow">Real Match Records — Deterministic</p>
          <h1 className="page-title">Match Center</h1>
          <p className="page-sub">
            Fixed historical records — every scorecard here reflects a real result, not a
            simulation. Looking for hypothetical match-ups instead? Try the{' '}
            <a href="/simulator" style={{ color: 'var(--amber)' }}>probabilistic Simulator</a>.
          </p>
        </div>

        {status === 'loading' && <p className="state-msg">Loading matches…</p>}
        {status === 'error' && <p className="state-msg error">Couldn't reach the API. Is the Flask backend running?</p>}
        {status === 'ready' && matches.length === 0 && <p className="state-msg">No matches seeded yet — run `python3 seed.py` in the backend.</p>}

        {status === 'ready' && matches.length > 0 && (
          <div className="match-grid">
            {matches.map((m) => (
              <button key={m.id} className="match-card" onClick={() => navigate(`/match/${m.id}`)}>
                <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{m.format}</span><span>{m.match_date}</span>
                </div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{m.team1?.name} vs {m.team2?.name}</div>
                <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  {m.venue} {m.result_margin ? `· ${m.result_margin}` : ''}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
