import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { api, canManage, clearUser, readUser, saveUser } from "../api"

export function Header() {
  const [user, setUser] = useState(readUser())

  useEffect(() => {
    let ignore = false
    api("/auth/me")
      .then((profile) => {
        if (ignore) return
        saveUser(profile)
        setUser(profile)
      })
      .catch(() => {
        if (ignore) return
        clearUser()
        setUser(null)
      })
    function sync() { setUser(readUser()) }
    window.addEventListener("vela-user", sync)
    return () => {
      ignore = true
      window.removeEventListener("vela-user", sync)
    }
  }, [])

  return (
    <header className="topbar">
      <div className="header">
        <Link to="/" className="logo">VELA</Link>
        <nav>
          <a href="/#fleet">Автопарк</a>
          <Link to="/account">Кабинет</Link>
          {canManage(user) && <Link to="/admin">Админ</Link>}
        </nav>
        <span className="phone">+7 495 123-45-67</span>
        {user ? <span className="who">{user.name}</span> : <Link className="btn" to="/login">Войти</Link>}
      </div>
    </header>
  )
}