import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { Header } from "../components/Header"
import { api, carImage, carName, clearUser, formatDate, formatPrice, rentalStatus, saveUser } from "../api"

export function Account() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState("orders")

  useEffect(() => {
    api("/auth/me")
      .then((profile) => { saveUser(profile); setUser(profile) })
      .catch(() => navigate("/login"))
    api("/rentals/my").then(setOrders).catch(() => setOrders([]))
  }, [])

  async function logout() {
    try { await api("/auth/logout", "POST") } catch {}
    clearUser()
    toast("Вы вышли")
    navigate("/login")
  }

  if (!user) return <><Header /><main className="page"><p>Загрузка…</p></main></>

  return (
    <>
      <Header />
      <main className="page cabinet">
        <aside className="panel side">
          <div className="avatar">{user.name?.[0]}</div>
          <h2>{user.name}</h2>
          <nav>
            <button className={tab === "orders" ? "on" : ""} onClick={() => setTab("orders")}>Заявки</button>
            <button className={tab === "profile" ? "on" : ""} onClick={() => setTab("profile")}>Профиль</button>
          </nav>
          <button className="btn btn-ghost" onClick={logout}>Выйти</button>
        </aside>
        {tab === "orders" ? (
          <section>
            <h1>Мои заявки</h1>
            {orders.length === 0 && (
              <article className="panel empty">
                <h2>Заявок пока нет</h2>
                <p className="lead">Выберите машину в каталоге и отправьте заявку.</p>
                <Link className="btn" to="/">Найти автомобиль</Link>
              </article>
            )}
            <div className="list">
              {orders.map((order) => (
                <article key={order.rental_id} className="order">
                  <img src={carImage(order.car)} alt={carName(order.car)} />
                  <div>
                    <p className="tag">VELA-{order.rental_id}</p>
                    <h3>{carName(order.car)}</h3>
                    <p>{formatDate(order.start_date)} — {formatDate(order.end_date)}</p>
                    <p className="spec">{rentalStatus(order)}</p>
                  </div>
                  <div className="order-side">
                    <b>{formatPrice(order.total_price)}</b>
                    <Link className="btn btn-ghost" to={"/cars/" + (order.car?.car_id || order.car_id)}>К машине</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section>
            <h1>Профиль</h1>
            <article className="panel">
              <p>Имя: {user.name} {user.surname}</p>
              <p>Почта: {user.email}</p>
              <p>Телефон: {user.phone}</p>
            </article>
          </section>
        )}
      </main>
    </>
  )
}