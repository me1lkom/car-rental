import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Header } from "../components/Header"
import { api, carImage, carName, formatDate, formatPrice } from "../api"

export function Car() {
  const { id } = useParams()
  const [car, setCar] = useState(null)
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [photoIndex, setPhotoIndex] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError("")
    api("/cars/" + id)
      .then((data) => {
        setCar(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.status === 404 ? "Машина не найдена" : "Не удалось загрузить машину")
        setLoading(false)
      })
    api("/cars/" + id + "/availability")
      .then((data) => setPeriods(data.unavailable_periods || []))
      .catch(() => setPeriods([]))
  }, [id])

  if (loading) return <><Header /><main className="page"><article className="panel"><p>Загрузка…</p></article></main></>
  if (error || !car) return (
    <>
      <Header />
      <main className="page">
        <article className="panel">
          <h1>{error || "Машина не найдена"}</h1>
          <Link className="btn" to="/">В каталог</Link>
        </article>
      </main>
    </>
  )

  const photos = [
    carImage(car),
    "/photos/eclass-2.jpg",
    "/photos/interior.jpg"
  ].filter(Boolean)

  const currentPhoto = photos[photoIndex] || photos[0]

  let days = 0
  if (startDate && endDate) {
    days = Math.max(0, Math.round((endDate - startDate) / 86400000))
  }
  const total = (car.price_per_day || 0) * days

  const specs = [
    car.body_type_name && ["Кузов", car.body_type_name],
    car.drive_type_name && ["Привод", car.drive_type_name],
    car.rental_class_name && ["Класс", car.rental_class_name],
    car.transmission_name && ["КПП", car.transmission_name],
    car.fuel_type_name && ["Топливо", car.fuel_type_name],
    car.seats && ["Мест", car.seats],
    car.doors && ["Дверей", car.doors],
    car.year && ["Год", car.year],
  ].filter(Boolean)

  const onChange = (dates) => {
    if (!dates) return
    const [start, end] = dates
    setStartDate(start || null)
    setEndDate(end || null)
  }

  const descriptions = {
    "Toyota Camry": "Комфортный седан для города и поездок на дальние расстояния. Подходит для повседневных задач и командировок. Просторный салон и мягкая подвеска.",
    "Mercedes-Benz E-class": "Представительный седан с высоким уровнем комфорта. Идеален для деловых поездок и длительных маршрутов. Тихий салон и качественная отделка.",
  }

  const desc = descriptions[carName(car)] || car.description || "Комфортный автомобиль для города и поездок."

  const toISO = (d) => d ? d.toISOString().slice(0, 10) : ""

  return (
    <>
      <Header />
      <main className="page">
        <p className="eyebrow">
          <Link to="/">Автопарк</Link> / {carName(car)}
        </p>

        <section className="car-top">
          <div className="left-col">
            <div className="photo big carousel">
              <img src={currentPhoto} alt={carName(car)} />
              {photos.length > 1 && (
                <>
                  <button type="button" className="carousel-btn left" onClick={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}>‹</button>
                  <button type="button" className="carousel-btn right" onClick={() => setPhotoIndex(i => (i + 1) % photos.length)}>›</button>
                  <div className="carousel-dots">
                    {photos.map((_, i) => (
                      <span key={i} className={i === photoIndex ? "on" : ""} onClick={() => setPhotoIndex(i)} />
                    ))}
                  </div>
                </>
              )}
            </div>

            <article className="panel" style={{ marginTop: 16 }}>
              <h3 style={{ margin: "0 0 8px" }}>Что входит</h3>
              <ul className="points">
                <li>ОСАГО и каско</li>
                <li>Предоплата в течение 15 минут</li>
                <li>Паспорт и права при выдаче</li>
                <li>Выдача в Москве</li>
              </ul>
            </article>
          </div>

          <article className="panel price-box">
            <div>
              <h1>{carName(car)}</h1>
              <p className="spec">{car.year} · {car.license_plate}</p>
              <p className="lead">{desc}</p>
            </div>

            <div className="calendar-wrap center">
              <h3>Выберите даты</h3>
              <DatePicker
                selected={startDate}
                onChange={onChange}
                startDate={startDate}
                endDate={endDate}
                selectsRange
                inline
                minDate={new Date()}
              />
            </div>

            <div className="book-bottom">
              {days > 0 && startDate && endDate && (
                <div className="total">
                  <span>{formatDate(toISO(startDate))} — {formatDate(toISO(endDate))}</span>
                  <b>{formatPrice(total)}</b>
                </div>
              )}
              <Link
                className="btn full"
                to={"/booking/" + car.car_id}
                style={{ pointerEvents: days > 0 ? "auto" : "none", opacity: days > 0 ? 1 : 0.5 }}
              >
                Оформить заявку
              </Link>
            </div>
          </article>
        </section>

        <section style={{ marginTop: 40 }}>
          <article className="panel">
            <h2>Характеристики</h2>
            <div className="spec-list">
              {specs.map(([name, value]) => (
                <div key={name} className="spec-row">
                  <span>{name}</span>
                  <b>{value}</b>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </>
  )
}
