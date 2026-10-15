import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { LogOut } from "lucide-react"
import { Header } from "../components/Header"
import { api, clearUser, formatPrice, readOrders, saveUser } from "../api"

export function Account() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const orders = readOrders()

  useEffect(() => {
    api("/auth/me")
      .then((profile) => {
        saveUser(profile)
        setUser(profile)
      })
      .catch(() => navigate("/login"))
  }, [])

  async function logout() {
    try {
      await api("/auth/logout", "POST")
    } catch {
      // сервер всё равно чистит cookies
    }
    clearUser()
    toast("Вы вышли")
    navigate("/login")
  }

  if (!user) return <><Header /><main className="page"><p>Загрузка…</p></main></>

  return (
    <>
      <Header />
      <main className="page account">
        <aside className="panel">
          <h2>{user.name} {user.surname}</h2>
          <p className="spec">{user.email}</p>
          <p className="spec">{user.phone}</p>
          <button className="btn btn-ghost" onClick={logout}><LogOut size={16} /> Выйти</button>
        </aside>
        <section>
          <p className="eyebrow">Личный кабинет</p>
          <h1>Здравствуйте, {user.name}</h1>
          <p className="lead">Заявки и статус предоплаты.</p>
          {orders.length === 0 && <p>Заявок пока нет.</p>}
          <div className="list">
            {orders.map((order) => (
              <article key={order.id} className="panel">
                <p className="tag">{order.id}</p>
                <h3>{order.carName}</h3>
                <p>{order.start} — {order.end} · {order.days} дн.</p>
                <p>{formatPrice(order.total)}</p>
              </article>
            ))}
          </div>
          <Link className="btn" to="/">Новая заявка</Link>
        </section>
      </main>
    </>
  )
}
