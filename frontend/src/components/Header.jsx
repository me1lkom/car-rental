import { Link } from "react-router-dom"
import { CarFront, Phone, User } from "lucide-react"
import { readUser } from "../api"

export function Header() {
  const user = readUser()
  return (
    <header className="topbar">
      <div className="header">
        <Link to="/" className="logo">VELA</Link>
        <span className="phone"><Phone size={16} /> +7 495 123-45-67</span>
        <nav>
          <Link to="/#fleet"><CarFront size={16} /> Автопарк</Link>
          <Link to="/account"><User size={16} /> Кабинет</Link>
          {user ? <span>{user.name}</span> : <Link to="/login">Войти</Link>}
        </nav>
      </div>
    </header>
  )
}
