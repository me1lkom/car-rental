import { useEffect, useState } from "react"
import { Header } from "../components/Header"
import { CarCard } from "../components/CarCard"
import { DateFields } from "../components/DateFields"
import { api } from "../api"

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    api("/cars/car-attributes").then(setAttrs).catch(() => setAttrs(null))
  }, [])

  useEffect(() => {
    setLoading(true)
    setError("")
    const query = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value) query.set(key, value)
    })
    api(query.toString() ? "/cars?" + query : "/cars")
      .then((data) => {
        setCars(data)
        setLoading(false)
      })
      .catch(() => {
        setError("Каталог временно недоступен. Проверьте, что сервер запущен.")
        setLoading(false)
      })
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
            <DateFields />
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
          <p className="spec">{!loading && !error ? "Найдено " + cars.length + " автомобилей" : ""}</p>
          <div className="filters">
            <select name="body_type_id" value={filter.body_type_id} onChange={change}>
              <option value="">Кузов</option>
              {attrs?.body_types?.map((item) => <option key={item.body_type_id} value={item.body_type_id}>{item.name}</option>)}
            </select>
            <input name="brand" value={filter.brand} onChange={change} placeholder="Марка" />
          </div>
        </div>

        {loading && <article className="panel"><p>Загрузка каталога…</p></article>}
        {error && (
          <article className="panel">
            <h2>Ошибка сервера</h2>
            <p className="error">{error}</p>
          </article>
        )}
        {!loading && !error && cars.length === 0 && (
          <article className="panel">
            <h2>Машин не найдено</h2>
            <p className="lead">По этому фильтру ничего нет. Сбросьте фильтры или выберите другой класс.</p>
          </article>
        )}
        {!loading && !error && (
          <section id="fleet" className="fleet">
            {cars.map((car) => <CarCard key={car.car_id} car={car} />)}
          </section>
        )}
      </main>
    </>
  )
}