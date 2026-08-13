import { useState } from 'react'
import {
  CONFIG, DEFAULT_CONFIG, GROUNDS, WEATHER_OPTIONS, FORMATS, ROLES, HANDS, BOWL_TYPES,
  simulateInnings, simulateTestMatch,
} from '../simulator/engine.js'
import { api } from '../api/client.js'

const ROLE_DEFAULTS = [
  ["Batsman", "Right-hand", "None"], ["Batsman", "Left-hand", "None"],
  ["Batsman", "Right-hand", "None"], ["Batsman", "Right-hand", "None"],
  ["All-rounder", "Left-hand", "Spin"], ["WK-Batsman", "Right-hand", "None"],
  ["All-rounder", "Right-hand", "Medium"], ["Bowler", "Right-hand", "Spin"],
  ["Bowler", "Right-hand", "Pace"], ["Bowler", "Left-hand", "Pace"], ["Bowler", "Right-hand", "Pace"],
]
function blankPlayer() { return { name: "", role: "Batsman", battingHand: "Right-hand", bowlingType: "None", experience: 0, age: 25 } }
function sampleXI(prefix) {
  return ROLE_DEFAULTS.map((d, i) => ({
    name: `${prefix} Player ${i + 1}`, role: d[0], battingHand: d[1], bowlingType: d[2],
    experience: 30 + i * 8, age: 22 + (i % 10),
  }))
}

const CONFIG_FIELDS = [
  { group: "Batting Skill", key: "battingBase", label: "Base skill", step: 1 },
  { group: "Batting Skill", key: "roleBonusBatsman", label: "Batsman role bonus", step: 1 },
  { group: "Batting Skill", key: "experienceWeightBat", label: "Experience weight (max pts)", step: 1 },
  { group: "Batting Skill", key: "agePeakBat", label: "Age peak (years)", step: 1 },
  { group: "Batting Skill", key: "agePenaltyBat", label: "Age penalty / year off-peak", step: 0.05 },
  { group: "Batting Skill", key: "pitchFlatBatBonus", label: "Flat pitch batting bonus", step: 1 },
  { group: "Batting Skill", key: "formVarianceBat", label: "Per-ball form variance (+/-)", step: 1 },

  { group: "Bowling Skill", key: "bowlingBase", label: "Base skill", step: 1 },
  { group: "Bowling Skill", key: "roleBonusBowler", label: "Bowler role bonus", step: 1 },
  { group: "Bowling Skill", key: "experienceWeightBowl", label: "Experience weight (max pts)", step: 1 },
  { group: "Bowling Skill", key: "pitchGreenPaceBonus", label: "Green pitch pace bonus", step: 1 },
  { group: "Bowling Skill", key: "pitchTurnerSpinBonus", label: "Dry turner spin bonus", step: 1 },
  { group: "Bowling Skill", key: "formVarianceBowl", label: "Per-ball form variance (+/-)", step: 1 },

  { group: "Match Aggression & Wickets", key: "aggressionT20", label: "T20 aggression multiplier", step: 0.05 },
  { group: "Match Aggression & Wickets", key: "aggressionODI", label: "ODI aggression multiplier", step: 0.05 },
  { group: "Match Aggression & Wickets", key: "aggressionTest", label: "Test aggression multiplier", step: 0.05 },
  { group: "Match Aggression & Wickets", key: "wicketBaseT20", label: "T20 base wicket rate", step: 0.1 },
  { group: "Match Aggression & Wickets", key: "wicketBaseODI", label: "ODI base wicket rate", step: 0.1 },
  { group: "Match Aggression & Wickets", key: "wicketBaseTest", label: "Test base wicket rate", step: 0.1 },

  { group: "Test Match Rules", key: "testMatchOvers", label: "Total match overs budget", step: 10 },
  { group: "Test Match Rules", key: "testInningsOversCap", label: "Per-innings overs cap", step: 5 },
  { group: "Test Match Rules", key: "followOnMargin", label: "Follow-on deficit threshold", step: 10 },
]

function uniqueNames(list, field) {
  const seen = new Set(), order = []
  list.forEach((s) => { if (!seen.has(s[field])) { seen.add(s[field]); order.push(s[field]) } })
  return order
}

function WagonWheelSvg({ shots }) {
  const size = 400, center = size / 2, maxR = size / 2 - 30
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="auto" style={{ maxWidth: 420 }}>
      <circle cx={center} cy={center} r={maxR} fill="none" stroke="var(--pitch-line)" strokeWidth="1.5" />
      <circle cx={center} cy={center} r={maxR * 0.6} fill="none" stroke="var(--pitch-line)" strokeWidth="1" strokeDasharray="4 4" />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180
        return <line key={i} x1={center} y1={center} x2={center + maxR * Math.sin(angle)} y2={center - maxR * Math.cos(angle)} stroke="var(--pitch-line)" strokeWidth="1" />
      })}
      <rect x={center - 6} y={center - 18} width="12" height="36" fill="var(--pitch-mid)" stroke="var(--muted)" strokeWidth="0.5" />
      {shots.map((s, i) => {
        const angle = (s.angle * Math.PI) / 180
        const r = s.distance * maxR
        const x = center + r * Math.sin(angle), y = center - r * Math.cos(angle)
        const color = s.runs === 6 ? 'var(--red)' : s.runs === 4 ? 'var(--amber)' : 'var(--blue)'
        return <circle key={i} cx={x} cy={y} r={s.runs >= 4 ? 4 : 2.5} fill={color} opacity="0.85" />
      })}
    </svg>
  )
}

function PitchMapSvg({ deliveries }) {
  const width = 260, height = 400
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ maxWidth: 280 }}>
      <rect x="0" y="0" width={width} height={height} fill="var(--pitch-mid)" stroke="var(--pitch-line)" />
      <line x1="0" y1="40" x2={width} y2="40" stroke="var(--cream)" strokeWidth="1.5" opacity="0.5" />
      <line x1="0" y1={height - 40} x2={width} y2={height - 40} stroke="var(--cream)" strokeWidth="1.5" opacity="0.5" />
      <line x1={width / 2} y1="0" x2={width / 2} y2={height} stroke="var(--pitch-line)" strokeWidth="1" strokeDasharray="3 3" />
      {deliveries.map((d, i) => {
        const x = (d.x ?? 0.5) * width
        const y = height - (d.y ?? 0.5) * height
        const color = d.isWicket ? 'var(--red)' : d.runsConceded >= 4 ? 'var(--amber)' : 'var(--blue)'
        return <circle key={i} cx={x} cy={y} r={d.isWicket ? 5 : 3} fill={color} opacity="0.85" />
      })}
    </svg>
  )
}

export default function Simulator() {
  const [squads, setSquads] = useState({ A: Array.from({ length: 11 }, blankPlayer), B: Array.from({ length: 11 }, blankPlayer) })
  const [currentSquad, setCurrentSquad] = useState('A')
  const [format, setFormat] = useState('T20')
  const [gender, setGender] = useState('male')
  const [groundIdx, setGroundIdx] = useState(0)
  const [weatherIdx, setWeatherIdx] = useState(0)
  const [teamAFirst, setTeamAFirst] = useState(true)
  const [validation, setValidation] = useState('')
  const [result, setResult] = useState(null)
  const [wagonScope, setWagonScope] = useState('')
  const [pitchScope, setPitchScope] = useState('')
  const [configVersion, setConfigVersion] = useState(0) // bump to force settings inputs to reflect resets
  const [saveStatus, setSaveStatus] = useState('idle')

  const updatePlayer = (team, idx, field, value) => {
    setSquads((prev) => {
      const next = { ...prev, [team]: prev[team].map((p, i) => i === idx ? { ...p, [field]: (field === 'experience' || field === 'age') ? Number(value) : value } : p) }
      return next
    })
  }

  const loadSample = (team) => setSquads((prev) => ({ ...prev, [team]: sampleXI(team) }))
  const clearTeam = (team) => setSquads((prev) => ({ ...prev, [team]: Array.from({ length: 11 }, blankPlayer) }))

  const validate = () => {
    const errors = []
    ;['A', 'B'].forEach((key) => {
      const squad = squads[key]
      const named = squad.filter((p) => p.name.trim().length > 0).length
      if (named < 11) errors.push(`Team ${key} needs all 11 player names filled in (${named}/11 so far).`)
      const bowlers = squad.filter((p) => p.bowlingType !== 'None').length
      if (bowlers < 5) errors.push(`Team ${key} needs at least 5 players who bowl (currently ${bowlers}).`)
    })
    return errors
  }

  const runSimulation = () => {
    const errors = validate()
    if (errors.length) { setValidation(errors.join(' ')); return }
    setValidation('')
    setSaveStatus('idle')

    const ctx = { format, gender, ground: GROUNDS[groundIdx], weather: WEATHER_OPTIONS[weatherIdx] }
    let matchResult

    if (format === 'TEST') {
      const testRes = simulateTestMatch(squads.A, squads.B, ctx, teamAFirst)
      matchResult = { ctx, ...testRes }
    } else {
      const battingFirst = teamAFirst ? squads.A : squads.B
      const bowlingFirst = teamAFirst ? squads.B : squads.A
      const firstLabel = teamAFirst ? 'Team A' : 'Team B'
      const secondLabel = teamAFirst ? 'Team B' : 'Team A'
      const inn1 = simulateInnings(battingFirst, bowlingFirst, ctx, null)
      const inn2 = simulateInnings(teamAFirst ? squads.B : squads.A, teamAFirst ? squads.A : squads.B, ctx, inn1.score + 1)
      const chaseSuccess = inn2.score >= inn1.score + 1
      matchResult = {
        ctx,
        inningsList: [
          { label: `${firstLabel} — Innings`, bowlingLabel: secondLabel, result: inn1, target: null },
          { label: `${secondLabel} — Innings`, bowlingLabel: firstLabel, result: inn2, target: inn1.score + 1 },
        ],
        winner: chaseSuccess ? secondLabel : firstLabel,
        margin: chaseSuccess ? `${10 - inn2.wickets} wickets` : `${inn1.score - inn2.score} runs`,
        resultType: chaseSuccess ? 'chase' : 'defend',
        followOnUsed: false,
      }
    }

    setResult(matchResult)
    setWagonScope('team:0')
    setPitchScope('team:0')
  }

  const saveResult = async () => {
    if (!result) return
    setSaveStatus('saving')
    try {
      await api.saveSimulation({
        team_a_name: squads.A[0]?.name ? 'Team A' : 'Team A',
        team_b_name: 'Team B',
        format: result.ctx.format,
        gender: result.ctx.gender,
        ground: result.ctx.ground.name,
        winner: result.winner,
        margin: result.margin,
        result,
      })
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }

  const currentWagonShots = () => {
    if (!result || !wagonScope) return []
    const [kind, idxStr, ...nameParts] = wagonScope.split(':')
    const inn = result.inningsList[Number(idxStr)]
    if (!inn) return []
    if (kind === 'team') return inn.result.wagonWheel
    const name = nameParts.join(':')
    return inn.result.wagonWheel.filter((s) => s.batsman === name)
  }

  const currentPitchDeliveries = () => {
    if (!result || !pitchScope) return []
    const [kind, idxStr, ...nameParts] = pitchScope.split(':')
    const inn = result.inningsList[Number(idxStr)]
    if (!inn) return []
    if (kind === 'team') return inn.result.pitchMap
    const name = nameParts.join(':')
    return inn.result.pitchMap.filter((d) => d.bowler === name)
  }

  const grouped = CONFIG_FIELDS.reduce((acc, f) => { (acc[f.group] = acc[f.group] || []).push(f); return acc }, {})

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <p className="eyebrow">Statistical Match Engine — Probabilistic</p>
          <h1 className="page-title">Simulate a match from your own XIs</h1>
          <p className="page-sub">
            Build two custom XIs, set the conditions, and run a ball-by-ball statistical simulation.
            Results come from probability distributions — not fixed history like the{' '}
            <a href="/" style={{ color: 'var(--amber)' }}>Match Center</a>.
          </p>
        </div>

        <div className="card">
          <h2>Match Conditions</h2>
          <p className="card-note">Ground and weather feed directly into the underlying probabilities.</p>
          <div className="settings-grid">
            <div>
              <label>Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="T20">T20</option><option value="ODI">ODI</option><option value="TEST">Test</option>
              </select>
            </div>
            <div>
              <label>Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="male">Men</option><option value="female">Women</option>
              </select>
            </div>
            <div>
              <label>Ground</label>
              <select value={groundIdx} onChange={(e) => setGroundIdx(Number(e.target.value))}>
                {GROUNDS.map((g, i) => <option key={i} value={i}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label>Weather</label>
              <select value={weatherIdx} onChange={(e) => setWeatherIdx(Number(e.target.value))}>
                {WEATHER_OPTIONS.map((w, i) => <option key={i} value={i}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="checkbox-row">
            <input type="checkbox" id="teamAFirst" checked={teamAFirst} onChange={(e) => setTeamAFirst(e.target.checked)} />
            <label htmlFor="teamAFirst" style={{ margin: 0 }}>Team A bats first</label>
          </div>
        </div>

        <div className="card">
          <h2>Squads</h2>
          <p className="card-note">Names are yours to enter. Set role, batting hand, bowling type, experience, and age for each.</p>
          <div className="squad-tabs">
            <button className={currentSquad === 'A' ? 'active' : ''} onClick={() => setCurrentSquad('A')}>Team A</button>
            <button className={currentSquad === 'B' ? 'active' : ''} onClick={() => setCurrentSquad('B')}>Team B</button>
          </div>
          <table className="squad-table">
            <thead><tr><th></th><th>Name</th><th>Role</th><th>Bat Hand</th><th>Bowl Type</th><th className="col-exp">Caps</th><th className="col-age">Age</th></tr></thead>
            <tbody>
              {squads[currentSquad].map((p, i) => (
                <tr key={i}>
                  <td className="col-num">{i + 1}</td>
                  <td><input type="text" placeholder="Player name" value={p.name} onChange={(e) => updatePlayer(currentSquad, i, 'name', e.target.value)} /></td>
                  <td><select value={p.role} onChange={(e) => updatePlayer(currentSquad, i, 'role', e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></td>
                  <td><select value={p.battingHand} onChange={(e) => updatePlayer(currentSquad, i, 'battingHand', e.target.value)}>{HANDS.map((h) => <option key={h}>{h}</option>)}</select></td>
                  <td><select value={p.bowlingType} onChange={(e) => updatePlayer(currentSquad, i, 'bowlingType', e.target.value)}>{BOWL_TYPES.map((b) => <option key={b}>{b}</option>)}</select></td>
                  <td className="col-exp"><input type="number" min="0" max="300" value={p.experience} onChange={(e) => updatePlayer(currentSquad, i, 'experience', e.target.value)} /></td>
                  <td className="col-age"><input type="number" min="15" max="50" value={p.age} onChange={(e) => updatePlayer(currentSquad, i, 'age', e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row-actions">
            <button className="btn" onClick={() => loadSample(currentSquad)}>Fill sample XI (current tab)</button>
            <button className="btn" onClick={() => clearTeam(currentSquad)}>Clear (current tab)</button>
          </div>
        </div>

        <details className="advanced">
          <summary>Advanced Engine Settings</summary>
          <p className="advanced-note">
            Every number here drives the simulation directly. Changes apply the next time you click Simulate.
            Categorical distributions (exact wicket-type mix, pitch line/length mix) stay fixed in this version.
          </p>
          <div className="row-actions" style={{ marginBottom: 16 }}>
            <button className="btn" onClick={() => { Object.keys(DEFAULT_CONFIG).forEach((k) => { CONFIG[k] = DEFAULT_CONFIG[k] }); setConfigVersion((v) => v + 1) }}>
              Reset to defaults
            </button>
          </div>
          {Object.entries(grouped).map(([groupName, fields]) => (
            <div className="settings-group" key={groupName}>
              <h4>{groupName}</h4>
              <div className="settings-grid">
                {fields.map((f) => (
                  <div key={f.key + configVersion}>
                    <label>{f.label}</label>
                    <input type="number" step={f.step} defaultValue={CONFIG[f.key]} onChange={(e) => { CONFIG[f.key] = Number(e.target.value) }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </details>

        <div className="simulate-bar">
          <div className="validation">{validation}</div>
          <button className="btn primary" onClick={runSimulation}>Simulate Match</button>
        </div>

        {result && (
          <div>
            <div className="result-banner">
              <div className="headline">{result.winner ? `${result.winner} won by ${result.margin}` : 'Match Drawn'}</div>
              {!result.winner && <div className="meta">{result.margin}</div>}
              <div className="meta">
                {FORMATS[result.ctx.format].label}{result.ctx.format === 'TEST' ? ' (2-innings)' : ''} · {result.ctx.ground.name} · {result.ctx.weather.name} · {result.ctx.gender === 'female' ? 'Women' : 'Men'}
                {result.followOnUsed ? ' · follow-on enforced' : ''}
              </div>
            </div>

            <div className="row-actions" style={{ marginBottom: 24 }}>
              <button className="btn primary" onClick={saveResult} disabled={saveStatus === 'saving'}>
                {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : 'Save this result'}
              </button>
              {saveStatus === 'error' && <span className="validation" style={{ margin: 0, alignSelf: 'center' }}>Couldn't save — are you logged in?</span>}
            </div>

            {result.inningsList.map((inn, idx) => {
              const r = inn.result
              return (
                <div className="card" key={idx}>
                  <div className="innings-title">
                    Innings {idx + 1} — {inn.label}
                    <span className="score">{r.score}/{r.wickets}</span>
                    <span className="mono" style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>({r.oversText} overs)</span>
                    {inn.target && <span className="mono" style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>(target {inn.target})</span>}
                    {!r.complete && <span className="mono" style={{ color: 'var(--red)', fontSize: '0.75rem' }}>(truncated — overs budget exhausted)</span>}
                  </div>
                  <table className="data-table">
                    <thead><tr><th>Batter</th><th className="num">R</th><th className="num">B</th><th className="num">4s</th><th className="num">6s</th><th className="num">SR</th><th>Dismissal</th></tr></thead>
                    <tbody>
                      {r.battingCard.map((b, i) => (
                        <tr key={i}>
                          <td>{b.name}</td><td className="num">{b.runs}</td><td className="num">{b.balls}</td>
                          <td className="num">{b.fours}</td><td className="num">{b.sixes}</td>
                          <td className="num">{b.balls ? Math.round((b.runs / b.balls) * 1000) / 10 : 0}</td>
                          <td>{b.out || (b.balls > 0 ? 'not out' : '—')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <table className="data-table">
                    <thead><tr><th>Bowler</th><th className="num">O</th><th className="num">R</th><th className="num">W</th><th className="num">Econ</th></tr></thead>
                    <tbody>
                      {r.bowlingCard.map((b, i) => {
                        const overs = Math.floor(b.ballsBowled / 6) + '.' + (b.ballsBowled % 6)
                        const econ = b.ballsBowled ? Math.round((b.runsConceded / (b.ballsBowled / 6)) * 100) / 100 : 0
                        return (
                          <tr key={i}>
                            <td>{b.name} <span className="mono" style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>({b.type})</span></td>
                            <td className="num">{overs}</td><td className="num">{b.runsConceded}</td><td className="num">{b.wickets}</td><td className="num">{econ}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })}

            <div className="card">
              <h2>Wagon Wheel</h2>
              <p className="card-note">Every scoring shot (1s and above) plotted by angle and distance.</p>
              <select value={wagonScope} onChange={(e) => setWagonScope(e.target.value)} style={{ marginBottom: 16 }}>
                {result.inningsList.map((inn, idx) => (
                  <optgroup label={inn.label} key={idx}>
                    <option value={`team:${idx}`}>{inn.label} — full innings</option>
                    {uniqueNames(inn.result.wagonWheel, 'batsman').map((n) => (
                      <option key={n} value={`player:${idx}:${n}`}>{n}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="grid-2">
                <div><WagonWheelSvg shots={currentWagonShots()} /></div>
                <div>
                  <div className="stat-grid">
                    <div className="stat-pill"><div className="stat-value">{currentWagonShots().length}</div><div className="stat-label">Shots Plotted</div></div>
                    <div className="stat-pill"><div className="stat-value">{currentWagonShots().filter((s) => s.runs >= 4).length}</div><div className="stat-label">Boundaries</div></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2>Pitch Map</h2>
              <p className="card-note">Every legal delivery plotted by line and length.</p>
              <select value={pitchScope} onChange={(e) => setPitchScope(e.target.value)} style={{ marginBottom: 16 }}>
                {result.inningsList.map((inn, idx) => (
                  <optgroup label={inn.bowlingLabel} key={idx}>
                    <option value={`team:${idx}`}>{inn.bowlingLabel} bowling — full innings</option>
                    {uniqueNames(inn.result.pitchMap, 'bowler').map((n) => (
                      <option key={n} value={`player:${idx}:${n}`}>{n}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="grid-2">
                <div><PitchMapSvg deliveries={currentPitchDeliveries()} /></div>
                <div>
                  <div className="stat-grid">
                    <div className="stat-pill"><div className="stat-value">{currentPitchDeliveries().length}</div><div className="stat-label">Deliveries</div></div>
                    <div className="stat-pill"><div className="stat-value">{currentPitchDeliveries().filter((d) => d.isWicket).length}</div><div className="stat-label">Wickets</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
