import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Header } from "../components/Header"
import { api, carImage, carName, formatPrice } from "../api"

const tabs = [
  ["", "Все"],
  ["Эконом", "Эконом"],
  ["Комфорт", "Комфорт"],
  ["Бизнес", "Бизнес"],
  ["Премиум", "Премиум"],
]

export function Home() {
  const [cars, setCars] = useState([])
  const [attrs, setAttrs] = useState(null)
  const [filter, setFilter] = useState({ rental_class_id: "", body_type_id: "", brand: "" })
  const [tab, setTab] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    api("/cars/car-attributes").then(setAttrs).catch(() => setAttrs(null))
  }, [])

  useEffect(() => {
    const query = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value) query.set(key, value)
    })
    api(query.toString() ? "/cars?" + query : "/cars")
      .then(setCars)
      .catch(() => setError("Каталог временно недоступен"))
  }, [filter])

  function pickClass(name) {
    setTab(name)
    const found = attrs?.rental_classes?.find((item) => item.name === name)
    setFilter((current) => ({ ...current, rental_class_id: found ? String(found.rental_class_id) : "" }))
  }

  function change(event) {
    setFilter((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  return (
    <>
      <Header />
      <main className="page">
        <h1>Аренда авто в Москве</h1>
        <p className="lead">Подберите машину и отправьте заявку онлайн</p>
        <section className="search">
          <form className="search-form" onSubmit={(event) => event.preventDefault()}>
            <p className="spec">Получение</p>
            <b>Москва</b>
            <div className="two">
              <label>Дата выдачи<input type="date" /></label>
              <label>Дата возврата<input type="date" /></label>
            </div>
            <label>Класс
              <select name="rental_class_id" value={filter.rental_class_id} onChange={change}>
                <option value="">Любой</option>
                {attrs?.rental_classes?.map((item) => <option key={item.rental_class_id} value={item.rental_class_id}>{item.name}</option>)}
              </select>
            </label>
            <button className="btn" type="submit">Подобрать авто</button>
          </form>
          <img className="search-photo" src="/photos/eclass.jpg" alt="Автомобиль VELA" />
        </section>

        <div className="tabs">
          {tabs.map(([value, label]) => (
            <button key={label} className={tab === value ? "tab on" : "tab"} onClick={() => pickClass(value)}>{label}</button>
          ))}
        </div>

        <div className="section-head">
          <p className="spec">{error ? "" : "Найдено " + cars.length + " автомобилей"}</p>
          <div className="filters">
            <select name="body_type_id" value={filter.body_type_id} onChange={change}>
              <option value="">Кузов</option>
              {attrs?.body_types?.map((item) => <option key={item.body_type_id} value={item.body_type_id}>{item.name}</option>)}
            </select>
            <input name="brand" value={filter.brand} onChange={change} placeholder="Марка" />
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        {!error && cars.length === 0 && <p>Машин по этому фильтру нет.</p>}
        <section id="fleet" className="fleet">
          {cars.map((car) => (
            <article key={car.car_id} className="card">
              <div className="photo">
                <img src={carImage(car)} alt={carName(car)} />
              </div>
              <div className="card-body">
                <h3>{carName(car)}</h3>
                <p className="spec">{car.year} · {car.body_type_name || "кузов"} · {car.seats ? car.seats + " мест" : "места"}</p>
                <div className="card-foot">
                  <b>{formatPrice(car.price_per_day)} / сутки</b>
                  <Link className="btn" to={"/cars/" + car.car_id}>Подробнее</Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  )
}