import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { Header } from "../components/Header"
import { api, saveUser } from "../api"

export function Register() {
  const navigate = useNavigate()

  async function onSubmit(event) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.target))
    try {
      await api("/auth/registration", "POST", data)
      const user = await api("/auth/login", "POST", { email: data.email, password: data.password })
      saveUser(user)
      toast.success("Аккаунт создан")
      navigate("/account")
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <>
      <Header />
      <main className="page auth">
        <img src="/photos/eclass.jpg" alt="Автомобиль VELA" />
        <form className="panel" onSubmit={onSubmit}>
          <p className="eyebrow">Регистрация</p>
          <h1>Создайте аккаунт за минуту</h1>
          <div className="two">
            <label>Имя<input name="name" required /></label>
            <label>Фамилия<input name="surname" required /></label>
          </div>
          <label>Телефон<input name="phone" required placeholder="+79990000000" /></label>
          <label>Почта<input name="email" type="email" required /></label>
          <label>Пароль<input name="password" type="password" minLength={8} required /></label>
          <button className="btn">Зарегистрироваться</button>
          <Link to="/login">Уже есть аккаунт? Войти</Link>
        </form>
      </main>
    </>
  )
}