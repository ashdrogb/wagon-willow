import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

export default function MySimulations() {
  const [sims, setSims] = useState([])
  const [status, setStatus] = useState('idle')
  const [selected, setSelected] = useState(null)

  const load = () => {
    setStatus('loading')
    api.listSimulations().then((data) => { setSims(data); setStatus('ready') }).catch(() => setStatus('error'))
  }

  useEffect(() => { load() }, [])

  const view = async (id) => {
    const data = await api.getSimulation(id)
    setSelected(data)
  }

  const remove = async (id) => {
    await api.deleteSimulation(id)
    if (selected?.id === id) setSelected(null)
    load()
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <p className="eyebrow">Your Account</p>
          <h1 className="page-title">My Simulations</h1>
          <p className="page-sub">Every match you've saved from the probabilistic Simulator.</p>
        </div>

        {status === 'loading' && <p className="state-msg">Loading…</p>}
        {status === 'error' && <p className="state-msg error">Couldn't load your simulations.</p>}
        {status === 'ready' && sims.length === 0 && <p className="state-msg">No saved simulations yet — run one from the Simulator page and click "Save this result".</p>}

        {status === 'ready' && sims.length > 0 && (
          <div className="match-grid">
            {sims.map((s) => (
              <div key={s.id} className="match-card">
                <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{s.format}</span><span>{new Date(s.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{s.team_a_name} vs {s.team_b_name}</div>
                <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 12 }}>
                  {s.ground} · {s.winner ? `${s.winner} won by ${s.margin}` : 'Drawn'}
                </div>
                <div className="row-actions" style={{ marginTop: 0 }}>
                  <button className="btn" onClick={() => view(s.id)}>View</button>
                  <button className="btn" onClick={() => remove(s.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="card" style={{ marginTop: 24 }}>
            <h2>{selected.team_a_name} vs {selected.team_b_name}</h2>
            <p className="card-note">{selected.format} · {selected.ground} · {selected.winner ? `${selected.winner} won by ${selected.margin}` : 'Drawn'}</p>
            {selected.result.inningsList.map((inn, idx) => (
              <table className="data-table" key={idx}>
                <thead><tr><th colSpan="2">{inn.label} — {inn.result.score}/{inn.result.wickets} ({inn.result.oversText} ov)</th></tr></thead>
                <tbody>
                  {inn.result.battingCard.filter((b) => b.balls > 0).map((b, i) => (
                    <tr key={i}><td>{b.name}</td><td className="num">{b.runs} ({b.balls})</td></tr>
                  ))}
                </tbody>
              </table>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
