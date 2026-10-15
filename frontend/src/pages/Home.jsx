import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Header } from "../components/Header"
import { api, carImage, carName, formatPrice } from "../api"

const steps = [
  ["01", "Выберите машину", "Класс, цена и фото в каталоге"],
  ["02", "Укажите даты", "Минимальный срок — 2 дня"],
  ["03", "Отправьте заявку", "Статус и предоплата появятся в кабинете"],
]

export function Home() {
  const [cars, setCars] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    api("/cars?status=available")
      .then(setCars)
      .catch(() => setError("Каталог недоступен. Запущен ли backend на порту 3000?"))
  }, [])

  return (
    <>
      <Header />
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Долгосрочная аренда</p>
          <h1>Автомобиль на недели, не на часы</h1>
          <p className="lead">Каталог приходит с сервера. Вход и регистрация уже подключены.</p>
          <div className="hero-actions">
            <a className="btn" href="#fleet">Смотреть автопарк</a>
            <Link className="btn btn-ghost" to="/register">Создать аккаунт</Link>
          </div>
        </div>
        <img src="/photos/eclass.jpg" alt="Автомобиль VELA" />
      </section>
      <main className="page">
        <section id="steps">
          <h2>Как это работает</h2>
          <div className="steps">
            {steps.map(([number, title, text]) => (
              <article key={number} className="step">
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="fleet">
          <h2>Автопарк</h2>
          {error && <p className="error">{error}</p>}
          {!error && cars.length === 0 && <p>Машин пока нет.</p>}
          <div className="fleet">
            {cars.map((car) => (
              <article key={car.car_id} className="card">
                <img src={carImage(car)} alt={carName(car)} />
                <div className="card-body">
                  <p className="tag">{car.status}</p>
                  <h3>{carName(car)}</h3>
                  <p className="spec">{car.year} · {car.license_plate}</p>
                  <p className="spec">{car.description}</p>
                  <div className="card-foot">
                    <b>{formatPrice(car.price_per_day)} / день</b>
                    <Link className="btn" to={"/cars/" + car.car_id}>Подробнее</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
