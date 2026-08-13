import { NavLink, Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import MatchDetail from './pages/MatchDetail.jsx'
import Simulator from './pages/Simulator.jsx'
import MySimulations from './pages/MySimulations.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

export default function App() {
  const { user, loading, logout } = useAuth()

  return (
    <div className="app-shell">
      <nav className="topnav">
        <div className="container topnav-inner">
          <div className="brand"><span className="brand-mark">///</span> Wagon &amp; Willow</div>
          <div className="nav-links">
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Match Center</NavLink>
            <NavLink to="/simulator" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Simulator</NavLink>
            {user && <NavLink to="/my-simulations" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>My Simulations</NavLink>}
          </div>
          <div className="nav-user">
            {!loading && (user ? (
              <>
                <span>{user.name}</span>
                <button className="btn" onClick={logout}>Log out</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="btn">Log in</NavLink>
                <NavLink to="/register" className="btn primary">Register</NavLink>
              </>
            ))}
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/match/:matchId" element={<MatchDetail />} />
        <Route path="/simulator" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
        <Route path="/my-simulations" element={<ProtectedRoute><MySimulations /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>

      <footer className="footer">Wagon &amp; Willow — real match records and a probabilistic match simulator, in one place.</footer>
    </div>
  )
}
