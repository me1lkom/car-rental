import { Link, useLocation } from "react-router-dom"
import { Header } from "../components/Header"
import { carName, formatPrice, rentalStatus } from "../api"

export function Done() {
  const rental = useLocation().state?.rental
  const car = useLocation().state?.car
  if (!rental) {
    return (
      <>
        <Header />
        <main className="page"><h1>Заявки нет</h1><Link to="/">В каталог</Link></main>
      </>
    )
  }
  return (
    <>
      <Header />
      <main className="page">
        <p className="eyebrow">Заявка создана</p>
        <h1>VELA-{rental.rental_id}</h1>
        <article className="panel">
          <h2>{carName(car)}</h2>
          <p>{rental.start_date} — {rental.end_date}</p>
          <p>{formatPrice(rental.total_price)}</p>
          <p className="spec">{rentalStatus(rental)}. Оплатите в течение 15 минут, иначе даты освободятся.</p>
        </article>
        <Link className="btn" to="/account">Открыть кабинет</Link>
      </main>
    </>
  )
}