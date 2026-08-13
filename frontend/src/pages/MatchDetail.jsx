import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'

export default function MatchDetail() {
  const { matchId } = useParams()
  const [scorecard, setScorecard] = useState(null)
  const [status, setStatus] = useState('idle')
  const navigate = useNavigate()

  useEffect(() => {
    setStatus('loading')
    api.getScorecard(matchId)
      .then((d) => { setScorecard(d); setStatus('ready') })
      .catch(() => setStatus('error'))
  }, [matchId])

  if (status === 'loading') return <div className="page"><div className="container"><p className="state-msg">Loading…</p></div></div>
  if (status === 'error' || !scorecard) return <div className="page"><div className="container"><p className="state-msg error">Couldn't load this match.</p></div></div>

  const { match, innings } = scorecard

  return (
    <div className="page">
      <div className="container">
        <button className="btn" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>← Back</button>
        <div className="page-head">
          <p className="eyebrow">{match.format} · Real Result</p>
          <h1 className="page-title">{match.team1?.name} vs {match.team2?.name}</h1>
          <p className="page-sub">{match.venue} · {match.match_date} {match.result_margin ? `· ${match.result_margin}` : ''}</p>
        </div>

        {innings.map((inn) => (
          <div className="card" key={inn.innings.id}>
            <div className="innings-title">
              {inn.innings.batting_team?.name}
              <span className="score">{inn.innings.total_runs}/{inn.innings.total_wickets}</span>
              <span className="mono" style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>({inn.innings.total_overs} ov)</span>
            </div>
            <table className="data-table">
              <thead><tr><th>Player</th><th className="num">R</th><th className="num">B</th><th className="num">4s</th><th className="num">6s</th><th className="num">SR</th><th>Dismissal</th></tr></thead>
              <tbody>
                {inn.player_stats.map((s) => (
                  <tr key={s.id}>
                    <td>{s.player?.full_name}</td>
                    <td className="num">{s.runs_scored}</td>
                    <td className="num">{s.balls_faced}</td>
                    <td className="num">{s.fours}</td>
                    <td className="num">{s.sixes}</td>
                    <td className="num">{s.strike_rate}</td>
                    <td>{s.how_out || 'not out'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}
