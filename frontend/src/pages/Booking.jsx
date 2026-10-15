import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import toast from "react-hot-toast"
import { Header } from "../components/Header"
import { api, carImage, carName, daysBetween, formatPrice, readOrders, readUser } from "../api"

export function Booking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = readUser()
  const [car, setCar] = useState(null)

  useEffect(() => {
    if (!user) navigate("/login")
    api("/cars/" + id).then(setCar).catch(() => toast.error("Машина не найдена"))
  }, [id])

  if (!car) return <><Header /><main className="page"><p>Загрузка…</p></main></>

  function onSubmit(event) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.target))
    const days = daysBetween(data.start, data.end)
    if (days < 2) {
      toast.error("Минимальный срок — 2 дня")
      return
    }
    const order = {
      id: "VELA-" + String(Date.now()).slice(-4),
      carId: car.car_id,
      carName: carName(car),
      start: data.start,
      end: data.end,
      days,
      total: days * car.price_per_day,
      paid: Boolean(data.pay),
    }
    const orders = readOrders()
    orders.unshift(order)
    localStorage.setItem("vela-orders", JSON.stringify(orders))
    localStorage.setItem("vela-last", JSON.stringify(order))
    toast.success("Заявка отправлена")
    navigate("/done")
  }

  return (
    <>
      <Header />
      <main className="page">
        <p className="eyebrow">Заявка</p>
        <h1>Оформление бронирования</h1>
        <p className="lead">Даты, водитель и предоплата. Срок меньше 2 дней не сохранится.</p>
        <section className="split">
          <form className="panel" onSubmit={onSubmit}>
            <div className="two">
              <label>Начало<input name="start" type="date" required /></label>
              <label>Конец<input name="end" type="date" required /></label>
            </div>
            <label>Имя водителя<input name="name" defaultValue={user?.name} required /></label>
            <label>Телефон<input name="phone" defaultValue={user?.phone} required /></label>
            <label className="check"><input name="pay" type="checkbox" /> Отметить предоплату</label>
            <button className="btn">Подтвердить</button>
          </form>
          <article className="panel">
            <img className="side-photo" src={carImage(car)} alt={carName(car)} />
            <h2>{carName(car)}</h2>
            <p>{formatPrice(car.price_per_day)} / день</p>
          </article>
        </section>
      </main>
    </>
  )
}
