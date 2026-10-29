import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Header } from "../components/Header"
import { api, carImage, carName, formatPrice, statusLabel } from "../api"

export function Car() {
  const { id } = useParams()
  const [car, setCar] = useState(null)
  const [periods, setPeriods] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    api("/cars/" + id).then(setCar).catch((err) => setError(err.message))
    api("/cars/" + id + "/availability")
      .then((data) => setPeriods(data.unavailable_periods || []))
      .catch(() => setPeriods([]))
  }, [id])

  if (error) return <><Header /><main className="page"><h1>{error}</h1></main></>
  if (!car) return <><Header /><main className="page"><p>Загрузка…</p></main></>

  const chips = [
    car.body_type_name, car.drive_type_name, car.rental_class_name,
    car.transmission_name, car.fuel_type_name,
    car.seats ? car.seats + " мест" : null,
    car.doors ? car.doors + " двери" : null,
  ].filter(Boolean)

  return (
    <>
      <Header />
      <main className="page">
        <p className="eyebrow">Автопарк / {carName(car)}</p>
        <section className="car-top">
          <div className="photo big"><img src={carImage(car)} alt={carName(car)} /></div>
          <article className="panel">
            <p className={"tag tag-" + car.status}>{statusLabel(car.status)}</p>
            <p className="price">{formatPrice(car.price_per_day)} / сутки</p>
            <p className="spec">{car.year} · {car.license_plate}</p>
            <p>{car.description}</p>
            <Link className="btn" to={"/booking/" + car.car_id}>Выбрать даты</Link>
            <p className="spec">
              {car.status === "available"
                ? "Сейчас свободна. Даты вне занятых периодов пройдут."
                : "Сейчас недоступна. Можно выбрать период после занятых дат."}
            </p>
          </article>
        </section>
        <h1>{carName(car)}</h1>
        <div className="chips">{chips.map((item) => <span key={item}>{item}</span>)}</div>
        <section className="split">
          <article className="panel">
            <h2>Занятые даты</h2>
            {periods.length === 0 && <p>Свободных ограничений нет. Можно бронировать на будущие даты.</p>}
            {periods.map((period) => <p key={period.start_date + period.end_date}>{period.start_date} — {period.end_date}</p>)}
          </article>
          <article className="panel">
            <h2>Условия аренды</h2>
            <ul className="points">
              <li>ОСАГО и каско уже в цене</li>
              <li>Предоплата в течение 15 минут</li>
              <li>Паспорт и права при выдаче</li>
              <li>Выдача в Москве</li>
            </ul>
          </article>
        </section>
      </main>
    </>
  )
}