import { Link } from 'react-router-dom'
import '../styles/navbar.css'
import auroraIcon from '../assets/aurora_icon.png'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="flex items-center ">
        <img src={auroraIcon} alt="AurorAI Icon" className="w-10 h-10" />
        <h1 className="navbar-title">AurorAI</h1>
      </div>

      <div className="navbar-links">
        <Link to="/" className="navbar-link">Dashboard</Link>
        <Link to="/upload" className="navbar-link">Upload</Link>
        <Link to="/admin" className="navbar-link">Admin</Link>
        <Link to="/login" className="navbar-link">Login</Link>
        <Link to="/signup" className="navbar-link">Sign Up</Link>
      </div>
    </nav>
  )
}
