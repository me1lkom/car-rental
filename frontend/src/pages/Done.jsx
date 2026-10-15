import { Link } from "react-router-dom"
import { Header } from "../components/Header"
import { formatPrice } from "../api"

export function Done() {
  const order = JSON.parse(localStorage.getItem("vela-last") || "null")
  if (!order) {
    return (
      <>
        <Header />
        <main className="page"><h1>Заявок нет</h1><Link to="/">В каталог</Link></main>
      </>
    )
  }
  const car = null
  return (
    <>
      <Header />
      <main className="page">
        <p className="eyebrow">Бронирование подтверждено</p>
        <h1>{order.id}</h1>
        <article className="panel row">
          {car && <img className="thumb" src={car.image} alt={order.carName} />}
          <div>
            <h2>{order.carName}</h2>
            <p>{order.start} — {order.end}</p>
            <p>{order.days} дн. · {formatPrice(order.total)}</p>
            <p className="spec">{order.paid ? "Предоплата отмечена" : "Предоплата не отмечена"}</p>
          </div>
        </article>
        <div className="steps">
          <article className="step"><span>01</span><h3>Подготовим автомобиль</h3></article>
          <article className="step"><span>02</span><h3>Напомним за сутки</h3></article>
          <article className="step"><span>03</span><h3>Ключи по паспорту</h3></article>
        </div>
        <Link className="btn" to="/account">Открыть кабинет</Link>
      </main>
    </>
  )
}
