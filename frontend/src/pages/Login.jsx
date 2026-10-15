import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { Header } from "../components/Header"
import { api, saveUser } from "../api"

export function Login() {
  const navigate = useNavigate()

  async function onSubmit(event) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.target))
    try {
      const user = await api("/auth/login", "POST", data)
      saveUser(user)
      toast.success("Вход выполнен")
      navigate("/account")
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <>
      <Header />
      <main className="page split">
        <section>
          <img className="side-photo" src="/photos/interior.jpg" alt="Салон" />
          <p className="eyebrow">Вход</p>
          <h1>Ваши поездки в одном месте</h1>
          <p className="lead">Та же почта и пароль, что при регистрации.</p>
        </section>
        <form className="panel" onSubmit={onSubmit}>
          <h2>Войти в VELA</h2>
          <label>Почта<input name="email" type="email" required /></label>
          <label>Пароль<input name="password" type="password" minLength={8} required /></label>
          <button className="btn">Войти</button>
          <Link to="/register">Нет аккаунта? Зарегистрироваться</Link>
        </form>
      </main>
    </>
  )
}
